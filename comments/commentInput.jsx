import { useState, useEffect } from "react";
import "./commentInput.css";
import { UploadIcon, InfoIcon } from "../components/Icons";
import { db } from "../src/firebase-config";
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { InfoModal } from "../components/popup";

function CommentInput({ userUUID, refresh, setRefresh, currentTargetId }) { 
  const [text, setText] = useState("");
  // 기본값은 localStorage에 미리 저장된 값 또는 하드코딩된 기본 프로필 URL
  const [userName, setUserName] = useState("익명 유령");
  const [userProfile, setUserProfile] = useState("/default_profile.webp");
  const [commentCount, setCommentCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // localStorage에서 사용자 정보 읽어오기 (초기)
  useEffect(() => {
    if (!userUUID) return;
    const storedName = localStorage.getItem("Fandex_userName");
    const storedProfile = localStorage.getItem("Fandex_userProfile") || "/default_profile.webp";
    if (storedName) setUserName(storedName);
    setUserProfile(storedProfile);
  }, [userUUID]);

  // 댓글 개수 가져오기
  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!currentTargetId) return;
      try {
        const commentRef = collection(db, "voteResults", currentTargetId, "comments");
        const snapshot = await getDocs(commentRef);
        setCommentCount(snapshot.size);
      } catch (error) {
        console.error("댓글 개수를 불러오는 중 오류 발생:", error);
      }
    };
    fetchCommentCount();
  }, [refresh, currentTargetId]);

  const isValidComment = text.length >= 10;

  const handleCommentSubmit = async () => {
    if (text.length < 10 || text.length > 200) {
      alert("댓글은 10자 이상 200자 이하로 작성해주세요.");
      return;
    }
    try {
      // 🔥 1) Firestore에서 최신 프로필 정보 가져오기
      let latestName = userName; 
      let latestProfile = userProfile; 

      if (userUUID) {
        const userDocRef = doc(db, "users", userUUID);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          // Firestore에 저장된 최신 displayName, profileImage가 있다면 사용
          if (data.displayName) {
            latestName = data.displayName;
            // localStorage에도 업데이트 (선택 사항)
            localStorage.setItem("Fandex_userName", data.displayName);
          }
          if (data.profileImage) {
            latestProfile = data.profileImage;
            // localStorage에도 업데이트 (선택 사항)
            localStorage.setItem("Fandex_userProfile", data.profileImage);
          }
        }
      }

      // 🔥 2) 댓글 문서 생성 시, 최신 프로필 정보로 저장
      const commentRef = collection(db, "voteResults", currentTargetId, "comments");
      await addDoc(commentRef, {
        authorUid: userUUID,
        displayName: latestName,
        profileImage: latestProfile,
        context: text,
        createdAt: serverTimestamp(),
        싫어요: 0,
        좋아요: 0,
        likedBy: [],
        dislikedBy: []
      });

      console.log("댓글이 성공적으로 저장되었습니다!");
      setText("");
      setRefresh(prev => !prev);
    } catch (error) {
      console.error("댓글 저장 중 오류 발생:", error);
    }
  };

  return (
    <div>
      <div className="row">
        <div className="left" onClick={() => {}}>
          <span className="left-text">댓글</span>
          <div 
            onClick={() => setModalOpen(true)} 
            style={{ display: "inline-block", cursor: "pointer" }}
          >
            <InfoIcon />
          </div>
        </div>
        <span className="right-text">{commentCount}개</span>
      </div>
      <div className="input-wrapper">
        <textarea
          className="comment"
          placeholder="댓글은 10자 이상 200자 이하로 작성해주세요."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div 
          className="upload-button"
          style={{ pointerEvents: isValidComment ? "auto" : "none" }}
          onClick={isValidComment ? handleCommentSubmit : undefined}
        >
          <UploadIcon 
            fill={isValidComment ? "#2C9CDB" : "#939393"} 
            style={{ cursor: isValidComment ? "pointer" : "default" }}
          />
        </div>
      </div>
      <InfoModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        message={
          <>
            댓글은 수정 또는 삭제가 불가하니
            <br />
            신중하게 작성해 주세요.
            <br />
            또한, 지나친 비방이나 욕설이 포함된 댓글은 임의로 삭제될 수 있어요.
          </>
        }
      />
    </div>
  );
}

export default CommentInput;
