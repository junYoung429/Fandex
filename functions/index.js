// functions/index.js
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

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
        .doc(datePath) // "2025-02-17"
        .collection("votesDocs")
        .where("voteDate", ">=", threshold)
        .get();
      
  
        if (votesQuerySnapshot.empty) {
          console.log("No new votes in the last 1 minute.");
          return;
        }
  
        // 각 targetId별 투표 합산 (응원해요, 아쉬워요)
        const sums = {};
  
        votesQuerySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const targetId = data.targetId;
          if (!targetId) return;
          if (!sums[targetId]) {
            sums[targetId] = { 응원해요: 0, 아쉬워요: 0 };
          }
          if (data.type === "응원해요") {
            sums[targetId].응원해요 += 1;
          } else if (data.type === "아쉬워요") {
            sums[targetId].아쉬워요 += 1;
          }
        });
  
        // 업데이트를 위한 batch 처리 (500개씩)
        let batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 500;
  
        for (const targetId in sums) {
          const targetDocRef = db.collection("voteResults").doc(targetId);
          batch.update(targetDocRef, {
            응원해요: FieldValue.increment(sums[targetId].응원해요),
            아쉬워요: FieldValue.increment(sums[targetId].아쉬워요)
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
  

export const resetVoteInfo = onSchedule(
  {
    schedule: "0 0 0 * * *", // 매일 20시 15분 (KST)
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
