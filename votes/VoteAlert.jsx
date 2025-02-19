import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../src/firebase-config";

// 오늘 날짜를 "YYYY-MM-DD" 형식으로 반환하는 함수
const getTodayDatePath = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function VoteAlerts() {
  const [alertQueue, setAlertQueue] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    // 1) 이미 존재하는 문서의 ID를 저장할 Set
    const existingDocs = new Set();

    // 2) 오늘 날짜 경로
    const todayPath = getTodayDatePath();
    const votesColRef = collection(db, "votes", todayPath, "votesDocs");
    const q = query(votesColRef, orderBy("voteDate", "asc"));

    // 3) 먼저 getDocs로 컬렉션에 이미 존재하는 문서들 가져오기
    getDocs(q).then((snapshot) => {
      snapshot.forEach((docSnap) => {
        existingDocs.add(docSnap.id);
      });

      // 4) onSnapshot 등록 (초기 문서는 무시하고, 이후 추가된 문서만 처리)
      onSnapshot(q, (snapshot) => {
        const newVotes = [];
        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id;
          const voteData = change.doc.data();

          // "added"와 "modified" 이벤트를 모두 확인합니다.
          if (
            (change.type === "added" || change.type === "modified") &&
            !change.doc.metadata.hasPendingWrites // 서버에 확정된 문서만 처리
          ) {
            // 기존에 없는 문서라면 (pending 단계에서 처리되지 못한 경우)
            if (!existingDocs.has(docId)) {
              existingDocs.add(docId);
              newVotes.push({ id: docId, ...voteData });
            }
          }
        });

        if (newVotes.length > 0) {
          console.log(`Realtime: Fetched ${newVotes.length} new votes`);
          setAlertQueue((prev) => [...prev, ...newVotes]);
        }
      });
    });
  }, []);

  // alertQueue가 업데이트되고, 현재 알림이 없을 때 큐에서 알림을 가져오기
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const nextAlert = alertQueue[0];
      setCurrentAlert(nextAlert);
      setAlertQueue((prev) => prev.slice(1));
    }
  }, [alertQueue, currentAlert]);

  // currentAlert가 설정되면 3초 후에 알림을 숨기도록 타이머 설정
  useEffect(() => {
    if (currentAlert) {
      const timerId = setTimeout(() => {
        setCurrentAlert(null);
      }, 3000);
      return () => clearTimeout(timerId);
    }
  }, [currentAlert]);

  // 항상 높이 20px의 영역을 렌더링 (알림이 없으면 투명)
  return (
    <div
      style={{
        ...alertBoxStyle,
        backgroundColor: currentAlert ? "rgba(0,0,0,0.5)" : "transparent",
      }}
    >
      {currentAlert && (
        <p style={alertTextStyle}>
          <span style={{ fontWeight: 700 }}>{currentAlert.displayName}</span> 님이{" "}
          <span style={{ fontWeight: 700 }}>{currentAlert.targetId}</span> 님을{" "}
          {currentAlert.type === "응원해요" ? "응원해요" : "아쉬워해요"}!
        </p>
      )}
    </div>
  );
}

// 항상 높이 20px, 가로 100% 차지
const alertBoxStyle = {
  width: "100%",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.3s",
};

const alertTextStyle = {
  margin: 0,
  fontSize: "14px",
  textAlign: "center",
  color: "white",
};

export default VoteAlerts;
