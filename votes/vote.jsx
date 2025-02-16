import "./vote.css"; // CSS 파일 임포트
import { InfoIcon, MyProfileIcon } from "../components/Icons";
import { useEffect, useState } from "react";
import { InfoModal, ProfileModal } from "../components/popup";
import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";
import CenterMode from "../test/CenterScroll";

function Vote({ currentTargetId, setCurrentTargetId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentAffiliate, setCurrentAffiliate] = useState("");
  const [voted, setVoted] = useState(false); // 🔹 해당 타겟에 대해 "이미 투표했는가" 여부
  const [voteType, setVoteType] = useState(null); // "응원해요" or "아쉬워요" (선택)
  const [userUUID, setUserUUID] = useState(localStorage.getItem("Fandex_userUUID"));

  // 🔹 currentTargetId가 바뀔 때마다 Firestore에서 voteinfo 확인
  useEffect(() => {
    const fetchAffiliate = async () => {
      if (!currentTargetId) return;

      try {
        const docRef = doc(db, "voteResults", currentTargetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentAffiliate(data.affiliate || "");
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching affiliate:", error);
      }
    };
    fetchAffiliate();
  }, [currentTargetId]);

  // 🔹 투표 상태(voted) 가져오기
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
        // users/{userUUID}/voteinfo/{currentTargetId} 문서 가져오기
        const voteInfoRef = doc(db, "users", userUUID, "voteinfo", currentTargetId);
        const voteInfoSnap = await getDoc(voteInfoRef);

        if (voteInfoSnap.exists()) {
          const voteData = voteInfoSnap.data();
          // voted가 true이면 "이미 투표한 상태"
          setVoted(!!voteData.voted);
          // 만약 투표 타입도 저장했다면, 예: { voted: true, type: "응원해요" }
          if (voteData.type) {
            setVoteType(voteData.type);
          } else {
            setVoteType(null);
          }
        } else {
          // 문서가 없으면 기본 false
          setVoted(false);
          setVoteType(null);
        }
      } catch (error) {
        console.error("Error fetching voteinfo:", error);
      }
    };

    fetchVotedInfo();
  }, [currentTargetId]);

  // 🔹 투표 버튼 클릭 시
  const handleVote = async (voteType) => {
    try {
      // votes 컬렉션에도 기록을 남기고 싶다면(기존 로직)
      const userUUID = localStorage.getItem("Fandex_userUUID");
      if (!userUUID) {
        console.error("사용자 UUID를 찾을 수 없습니다.");
        return;
      }

      // votes 컬렉션에 기록 (선택사항)
      const votesRef = collection(db, "votes");
      await addDoc(votesRef, {
        authorUUID: userUUID,
        type: voteType,
        voteDate: serverTimestamp(),
        targetId: currentTargetId
      });

      // 🔹 users/{userUUID}/voteinfo/{currentTargetId} 문서를 { voted: true, type: voteType }로 업데이트
      const voteInfoRef = doc(db, "users", userUUID, "voteinfo", currentTargetId);
      await setDoc(voteInfoRef, {
        voted: true,
        type: voteType
      }, { merge: true });

      console.log("투표가 성공적으로 저장되었습니다!");
      // 로컬 상태 업데이트
      setVoted(true);
      setVoteType(voteType);
    } catch (error) {
      console.error("투표 저장 중 오류 발생:", error);
    }
  };

  return (
    <div>
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
          </>
        }
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onRequestClose={() => setProfileModalOpen(false)}
        userUUID={userUUID}
      />

      <div style={{ height: "20px" }}></div>

      <CenterMode currentTargetId={currentTargetId} setCurrentTargetId={setCurrentTargetId} />

      <div className="full-width affiliate-container">
        <span>{currentAffiliate}</span>
      </div>
      <div className="full-width name-container">
        <span>{currentTargetId}</span>
      </div>

      <div className="row-bottom">
        {/* 🔹 이미 voted=true 라면, "확장된" 버튼을 하나만 보여주고,
                아직 voted=false 라면, 버튼 2개(응원해요 / 아쉬워요) 노출 */}
        {voted ? (
          // 이미 투표한 경우, voteType에 따라 "응원해요" 또는 "아쉬워요" 버튼 확장 상태
          <div
            className={`voteButton expanded ${
              voteType === "응원해요" ? "voteButton-like" : "voteButton-dislike"
            }`}
          >
            <span>{voteType}</span>
          </div>
        ) : (
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
