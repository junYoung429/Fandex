const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.aggregateVotes = functions.firestore
  .document("votes/{voteId}") // ✅ v1 방식
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data(); 
    if (!data?.targetId || !data?.type) {
      console.log("No targetId or type found");
      return;
    }

    const db = admin.firestore();
    const targetDocRef = db.collection("voteResults").doc(data.targetId);

    try {
      await db.runTransaction(async (transaction) => {
        const targetDoc = await transaction.get(targetDocRef);
        if (!targetDoc.exists) {
          throw new Error("Target document does not exist!");
        }
        let updateData = {};
        if (data.type === "응원해요") {
          updateData["응원해요"] = admin.firestore.FieldValue.increment(1);
        } else if (data.type === "아쉬워요") {
          updateData["아쉬워요"] = admin.firestore.FieldValue.increment(1);
        }
        transaction.update(targetDocRef, updateData);
      });
      console.log(`✅ [V1] 투표 합산 완료: ${data.targetId}`);
    } catch (error) {
      console.error("❌ [V1] 투표 합산 중 오류:", error);
    }
  });


  exports.resetVoteInfo = functions.pubsub.schedule("every day 12:00")
  .timeZone("Asia/Seoul") // 한국 시간 기준 (오후 12시)
  .onRun(async (context) => {
    const db = admin.firestore();
    console.log("🔄 모든 유저의 voteinfo 필드 초기화 시작...");

    try {
      const usersSnapshot = await db.collection("users").get();
      const userDocs = usersSnapshot.docs;

      const BATCH_SIZE = 500; // Firestore 트랜잭션 한계 (한 번에 500개까지)
      let batch = db.batch();
      let batchCount = 0;
      let batchIndex = 1;

      for (let i = 0; i < userDocs.length; i++) {
        const userDocRef = userDocs[i].ref;
        batch.update(userDocRef, { voted: false });
        batchCount++;

        // 500개 문서를 처리했거나 마지막 문서라면 commit
        if (batchCount === BATCH_SIZE || i === userDocs.length - 1) {
          await batch.commit();
          console.log(`✅ Batch ${batchIndex} (총 ${batchCount}개 문서) 초기화 완료.`);
          batchIndex++;
          batch = db.batch(); // 새로운 batch 시작
          batchCount = 0;
        }
      }

      console.log("🎉 모든 유저의 voteinfo 필드가 False로 초기화되었습니다.");
    } catch (error) {
      console.error("❌ voteinfo 초기화 중 오류 발생:", error);
    }
  });

