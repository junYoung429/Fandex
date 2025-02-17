// functions/index.js
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

// 누적 투표 1분마다 갱신

export const aggregateVotesScheduled = onSchedule(
  {
    schedule: "every 1 minutes", // 매 1분마다 실행
    timeZone: "Asia/Seoul"
  },
  async (event) => {
    const db = getFirestore();
    const now = new Date();
    const threshold = new Date(now.getTime() - 60 * 1000); // 1분 전

    // 오늘 날짜를 "YYYY-MM-DD" 형식으로 생성
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePath = `${year}-${month}-${day}`;

    console.log("Starting scheduled aggregation for votes from:", datePath, "since", threshold);

    try {
      // 오늘 날짜 하위의 votesDocs 컬렉션에서 최근 1분 내 생성된 투표 문서 조회
      const votesQuerySnapshot = await db
        .collection("votes")
        .doc(datePath)
        .collection("votesDocs")
        .where("voteDate", ">=", threshold)
        .get();

      if (votesQuerySnapshot.empty) {
        console.log("No new votes in the last 1 minute.");
        return;
      }

      // 각 targetId별 투표 합산
      // -> 응원해요, 아쉬워요 뿐 아니라 유효_응원해요, 유효_아쉬워요도 함께 누적
      const sums = {};

      votesQuerySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const targetId = data.targetId;
        if (!targetId) return;

        // 초기화 (응원해요, 아쉬워요 + 유효_응원해요, 유효_아쉬워요)
        if (!sums[targetId]) {
          sums[targetId] = {
            응원해요: 0,
            아쉬워요: 0,
            유효_응원해요: 0,
            유효_아쉬워요: 0
          };
        }

        // type이 "응원해요"면 응원해요, 유효_응원해요에 1씩
        // type이 "아쉬워요"면 아쉬워요, 유효_아쉬워요에 1씩
        if (data.type === "응원해요") {
          sums[targetId].응원해요 += 1;
          sums[targetId].유효_응원해요 += 1;
        } else if (data.type === "아쉬워요") {
          sums[targetId].아쉬워요 += 1;
          sums[targetId].유효_아쉬워요 += 1;
        }
      });

      // 업데이트를 위한 batch 처리 (500개씩)
      let batch = db.batch();
      let batchCount = 0;
      const BATCH_SIZE = 500;

      for (const targetId in sums) {
        const targetDocRef = db.collection("voteResults").doc(targetId);

        // 응원해요/아쉬워요와 유효_응원해요/유효_아쉬워요를 모두 increment
        batch.update(targetDocRef, {
          응원해요: FieldValue.increment(sums[targetId].응원해요),
          아쉬워요: FieldValue.increment(sums[targetId].아쉬워요),
          유효_응원해요: FieldValue.increment(sums[targetId].유효_응원해요),
          유효_아쉬워요: FieldValue.increment(sums[targetId].유효_아쉬워요)
        });

        batchCount++;
        if (batchCount === BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed a batch of ${batchCount} updates.`);
          batch = db.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }
      console.log("Scheduled aggregation completed:", sums);
    } catch (error) {
      console.error("Error during scheduled aggregation:", error);
    }
  }
);

// 모든 유저 투표 가능 초기화   
export const resetVoteInfo = onSchedule(
  {
    schedule: "0 0 * * *", // 매일 20시 15분 (KST)
    timeZone: "Asia/Seoul"
  },
  async (event) => {
    const db = getFirestore();
    console.log("🔄 모든 유저의 voteinfo 하위 컬렉션 초기화 시작...");

    try {
      // 1) 모든 user 문서 가져오기
      const usersSnapshot = await db.collection("users").get();
      const userDocs = usersSnapshot.docs;

      const BATCH_SIZE = 500;
      let batch = db.batch();
      let batchCount = 0;
      let batchIndex = 1;

      // 2) 각 유저에 대해 voteinfo 하위 컬렉션의 문서들을 가져옴
      for (let i = 0; i < userDocs.length; i++) {
        const userDocRef = userDocs[i].ref;

        // 하위 컬렉션 "voteinfo"의 모든 문서 가져오기
        const voteinfoSnapshot = await userDocRef.collection("voteinfo").get();

        voteinfoSnapshot.forEach((voteinfoDoc) => {
          // voteinfoDoc = "users/{userId}/voteinfo/{targetId}"
          batch.update(voteinfoDoc.ref, { voted: false });
          batchCount++;

          // 배치 한도(500개) 도달 시 commit
          if (batchCount === BATCH_SIZE) {
            batch.commit();
            console.log(`✅ Batch ${batchIndex} (총 ${batchCount}개 문서) 커밋 완료.`);
            batchIndex++;
            batch = db.batch();
            batchCount = 0;
          }
        });
      }

      // 남은 배치 커밋
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Batch ${batchIndex} (총 ${batchCount}개 문서) 커밋 완료.`);
      }

      console.log("🎉 모든 유저의 voteinfo 문서 voted 필드를 false로 초기화 완료!");
    } catch (error) {
      console.error("❌ voteinfo 초기화 중 오류 발생:", error);
    }
  }
);


// 가중치 계산
export const computeWeightedVotes = onSchedule(
  {
    // 매일 자정(00:00) KST에 실행
    schedule: "0 0 * * *", 
    timeZone: "Asia/Seoul"
  },
  async (event) => {
    const db = getFirestore();

    // 현재 시각(자정)
    const now = new Date(); // ex) 2025-02-18T00:00:00 KST
    console.log("⚖️ 가중치 투표 계산 시작:", now.toISOString());

    try {
      // 최종 결과를 저장할 객체: { [targetId]: { 응원해요: number, 아쉬워요: number } }
      const sums = {};

      // 0~4일 전 날짜에 대해 반복
      for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
        // 가중치 계산: dayOffset=0 -> 1.0, dayOffset=1 -> 0.8, ...
        const weight = Math.max(1 - 0.2 * dayOffset, 0); 
        if (weight <= 0) break; // 5일째부터는 0표이므로 무효

        // dayOffset일 전 날짜(YYYY-MM-DD) 구하기
        const dateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const datePath = `${year}-${month}-${day}`; // ex) "2025-02-17"

        console.log(` - [${datePath}] dayOffset=${dayOffset}, weight=${weight}`);

        // votes/{datePath}/votesDocs 하위 컬렉션 가져오기
        const dayCollectionRef = db.collection(`votes/${datePath}/votesDocs`);
        const daySnapshot = await dayCollectionRef.get();
        if (daySnapshot.empty) {
          console.log(`   -> ${datePath} 에는 투표 문서가 없습니다.`);
          continue;
        }

        // 문서마다 targetId, type 확인 → sums[targetId]에 weight를 누적
        daySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const targetId = data.targetId;
          const type = data.type;
          if (!targetId || !type) return;

          // 초기화
          if (!sums[targetId]) {
            sums[targetId] = { 응원해요: 0, 아쉬워요: 0 };
          }

          if (type === "응원해요") {
            sums[targetId].응원해요 += weight;
          } else if (type === "아쉬워요") {
            sums[targetId].아쉬워요 += weight;
          }
        });
      }

      // 이제 sums 객체를 이용해 voteResults/{targetId} 문서의 유효_응원해요, 유효_아쉬워요를 "덮어쓰기"
      let batch = db.batch();
      let count = 0;
      const BATCH_SIZE = 500;

      for (const targetId in sums) {
        const targetRef = db.collection("voteResults").doc(targetId);
        const { 응원해요, 아쉬워요 } = sums[targetId];

        // 가중치 합산값으로 덮어쓰기
        // (increment가 아니라, 직접 값으로 세팅)
        batch.update(targetRef, {
          유효_응원해요: 응원해요,
          유효_아쉬워요: 아쉬워요
        });

        count++;
        if (count === BATCH_SIZE) {
          await batch.commit();
          console.log(`   -> ${count}개 문서 커밋 완료.`);
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        console.log(`   -> ${count}개 문서 커밋 완료.`);
      }

      console.log("✅ 가중치 투표 계산 완료!", sums);
    } catch (err) {
      console.error("❌ 가중치 계산 중 오류 발생:", err);
    }
  }
);

