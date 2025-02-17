// functions/index.js
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();

export const aggregateVotes = onDocumentCreated("votes/{voteId}", async (event) => {
  const data = event.data?.data();
  if (!data?.targetId || !data?.type) {
    console.log("No targetId or type found");
    return;
  }

  const db = getFirestore();
  const targetDocRef = db.collection("voteResults").doc(data.targetId);

  try {
    await db.runTransaction(async (transaction) => {
      const targetDoc = await transaction.get(targetDocRef);
      if (!targetDoc.exists) {
        throw new Error("Target document does not exist!");
      }
      let updateData = {};
      if (data.type === "응원해요") {
        updateData["응원해요"] = FieldValue.increment(1);
      } else if (data.type === "아쉬워요") {
        updateData["아쉬워요"] = FieldValue.increment(1);
      }
      transaction.update(targetDocRef, updateData);
    });
    console.log(`✅ [V2] 투표 합산 완료: ${data.targetId}`);
  } catch (error) {
    console.error("❌ [V2] 투표 합산 중 오류:", error);
  }
});

export const resetVoteInfo = onSchedule(
  {
    schedule: "0 20 * * *", // 매일 12:00 (KST 기준)
    timeZone: "Asia/Seoul"
  },
  async (event) => {
    const db = getFirestore();
    console.log("🔄 모든 유저의 voteinfo 필드 초기화 시작 (v2)...");

    try {
      const usersSnapshot = await db.collection("users").get();
      const userDocs = usersSnapshot.docs;
      const BATCH_SIZE = 500;
      let batch = db.batch();
      let batchCount = 0;
      let batchIndex = 1;

      for (let i = 0; i < userDocs.length; i++) {
        const userDocRef = userDocs[i].ref;
        batch.update(userDocRef, { voted: false });
        batchCount++;
        if (batchCount === BATCH_SIZE || i === userDocs.length - 1) {
          await batch.commit();
          console.log(`✅ Batch ${batchIndex} (총 ${batchCount}개 문서) 초기화 완료.`);
          batchIndex++;
          batch = db.batch();
          batchCount = 0;
        }
      }
      console.log("🎉 모든 유저의 voteinfo 필드가 False로 초기화되었습니다 (v2).");
    } catch (error) {
      console.error("❌ voteinfo 초기화 중 오류 발생 (v2):", error);
    }
  }
);
