import "./vote.css"; // CSS 파일 임포트
import { InfoIcon, MyProfileIcon } from "../components/Icons";
import { useEffect, useState } from "react";
import { InfoModal, ProfileModal } from "../components/popup";
import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import CenterMode from "./CenterScroll";
import VoteAlerts from "./VoteAlert";
import { STATIC_TARGETS } from "../utils/targets";

// 자정까지 남은 시간 계산 (오늘 24시)
function getTimeLeftUntilMidnight() {
  const now = new Date();
  // 오늘 자정(= 내일 0시)
  // 예: 오늘이 2/17이면, new Date(연도, 월, 일+1, 0,0,0)
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

  let diffMs = midnight - now; // 남은 밀리초
  if (diffMs < 0) {
    // 이미 자정 지났다면 0으로 처리
    diffMs = 0;
  }
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  return { hours, minutes, seconds };
}

function Vote({ currentTargetId, setCurrentTargetId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentAffiliate, setCurrentAffiliate] = useState("");
  const [voted, setVoted] = useState(false); // 해당 타겟에 대해 "이미 투표했는가" 여부
  const [voteType, setVoteType] = useState(null); // "응원해요" or "아쉬워요"
  const [userUUID, setUserUUID] = useState(localStorage.getItem("Fandex_userUUID"));

  // ⏰ 카운트다운 상태: hours, minutes, seconds
  const [timeLeft, setTimeLeft] = useState(getTimeLeftUntilMidnight());

  // 1) 매초마다 남은 시간 갱신
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft(getTimeLeftUntilMidnight());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // 2) voteResults에서 현재Target의 affiliate 정보 가져오기
  useEffect(() => {
    if (!currentTargetId) return;
    const targetData = STATIC_TARGETS.find((t) => t.id === currentTargetId);
    if (targetData) {
      setCurrentAffiliate(targetData.affiliate);
    } else {
      setCurrentAffiliate("");
    }
  }, [currentTargetId]);

  // 3) users/{userUUID}/voteinfo/{currentTargetId} 문서 확인 → 투표했는지 여부
  useEffect(() => {
    const fetchVotedInfo = async () => {
      if (!currentTargetId) {
        setVoted(false);
        setVoteType(null);
        return;
      }
      const userUUID = localStorage.getItem("Fandex_userUUID");
      if (!userUUID) return;

      try {
        const voteInfoRef = doc(db, "users", userUUID, "voteinfo", currentTargetId);
        const voteInfoSnap = await getDoc(voteInfoRef);

        if (voteInfoSnap.exists()) {
          const voteData = voteInfoSnap.data();
          setVoted(!!voteData.voted);
          if (voteData.type) {
            setVoteType(voteData.type);
          } else {
            setVoteType(null);
          }
        } else {
          setVoted(false);
          setVoteType(null);
        }
      } catch (error) {
        console.error("Error fetching voteinfo:", error);
      }
    };
    fetchVotedInfo();
  }, [currentTargetId]);

  // 4) 투표 버튼 클릭 시
  const handleVote = async (type) => {
    try {
      const userUUID = localStorage.getItem("Fandex_userUUID");
      if (!userUUID) {
        console.error("사용자 UUID를 찾을 수 없습니다.");
        return;
      }

      // 로컬스토리지에서 displayName 가져오기
      const displayName = localStorage.getItem("Fandex_userName") || "익명";

      // 날짜별 경로
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const datePath = `${year}-${month}-${day}`;

      // votes/{YYYY-MM-DD}/votesDocs
      const votesRef = collection(db, "votes", datePath, "votesDocs");
      await addDoc(votesRef, {
        authorUUID: userUUID,
        displayName, // 투표한 사람의 이름 추가
        type,
        voteDate: serverTimestamp(),
        targetId: currentTargetId,
      });

      // users/{userUUID}/voteinfo/{currentTargetId} 문서 업데이트
      const voteInfoRef = doc(db, "users", userUUID, "voteinfo", currentTargetId);
      await setDoc(voteInfoRef, { voted: true, type }, { merge: true });

      console.log("투표가 성공적으로 저장되었습니다!");
      setVoted(true);
      setVoteType(type);
    } catch (error) {
      console.error("투표 저장 중 오류 발생:", error);
    }
  };

  // 남은 시간 표시 문자열
  const { hours, minutes, seconds } = timeLeft;
  const timeString = (
    <>
      다음 투표는{" "}
      <span style={{ fontWeight: 800, color: "#2C9CDB" }}>
        {hours}시간 {minutes}분 {seconds}초
      </span>{" "}
      후 가능합니다
    </>
  );

  return (
    <div>
      <div className="logo-container">
        <span className="logo-text">
          <span style={{ color: "#B3CE1F" }}>FAN</span>
          <span style={{ color: "#7D6CF6" }}>DEX</span>
        </span>
      </div>
      <div className="row-top">
        <div className="left">
          <span className="left-text">투표</span>
          <div onClick={() => setModalOpen(true)} style={{ display: "inline-block", cursor: "pointer" }}>
            <InfoIcon />
          </div>
        </div>
        <div onClick={() => setProfileModalOpen(true)} style={{ display: "inline-block", cursor: "pointer" }}>
          <MyProfileIcon />
        </div>
      </div>

      <InfoModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        message={
          <>
            FANDEX는
            <br />
            자체 개발한 투표 집계 시스템을 통해
            <br />
            항상 최신의 지지율을 반영해요.
            <br />
            <br />
            누적투표수: 투표된 모든 표의 총 개수
            <br />
            누적응답수: 투표된 모든 응답
            <br />
            (응원해요 or 아쉬워요)의 총 개수
            <br />
            유효응답수: 최근 5일 이내 투표된 모든 응답의 표의 가치의 총 합
            <br />
            <br />
            사이트 관련 모든 문의는 seoyoonjsy@naver.com으로 부탁드립니다.
            </>
        }
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onRequestClose={() => setProfileModalOpen(false)}
        userUUID={userUUID}
      />
      

      <VoteAlerts />

      {/* <div style={{ height: "20px" }}></div> */}

      <div style={{ height: "76px" }}></div>

      <CenterMode currentTargetId={currentTargetId} setCurrentTargetId={setCurrentTargetId} />

      <div className="full-width affiliate-container">
        <span>{currentAffiliate}</span>
      </div>
      <div className="full-width name-container">
        <span>
          {
            // STATIC_TARGETS에서 이름도 lookup해서 표시
            STATIC_TARGETS.find((t) => t.id === currentTargetId)?.name || currentTargetId
          }
        </span>
      </div>

      <div className="row-bottom">
        {voted ? (
          // 이미 투표한 경우
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div
              className={`voteButton expanded ${
                voteType === "응원해요" ? "voteButton-like" : "voteButton-dislike"
              }`}
              style={{ marginBottom: "12px" }}
            >
              <span>{voteType}</span>
            </div>
            <div className="countdown-text">
              {timeString}
            </div>
          </div>
        ) : (
          // 아직 투표 안 했다면
          <>
            <div
              className="voteButton voteButton-like"
              onClick={() => handleVote("응원해요")}
            >
              <span>응원해요</span>
            </div>
            <div
              className="voteButton voteButton-dislike"
              onClick={() => handleVote("아쉬워요")}
            >
              <span>아쉬워요</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Vote;
