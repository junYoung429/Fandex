import { useState, useEffect } from "react";
import "./commentInput.css";
import { UploadIcon, InfoIcon } from "../components/Icons";
import { db } from "../src/firebase-config";
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { InfoModal } from "../components/popup";

function CommentInput({ userUUID, refresh, setRefresh, currentTargetId }) { 
  const [text, setText] = useState("");
  const [userName, setUserName] = useState("익명 유령");
  const [userProfile, setUserProfile] = useState("/default_profile.webp");
  const [commentCount, setCommentCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!userUUID) return;
    const storedName = localStorage.getItem("Fandex_userName");
    const storedProfile = localStorage.getItem("Fandex_userProfile") || "/default_profile.webp";
    if (storedName) setUserName(storedName);
    setUserProfile(storedProfile);
  }, [userUUID]);

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

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      console.log("댓글 저장 시도 중...");
      let latestName = userName; 
      let latestProfile = userProfile; 

      if (userUUID) {
        const userDocRef = doc(db, "users", userUUID);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.displayName) {
            latestName = data.displayName;
            localStorage.setItem("Fandex_userName", data.displayName);
          }
          if (data.profileImage) {
            latestProfile = data.profileImage;
            localStorage.setItem("Fandex_userProfile", data.profileImage);
          }
        }
      }

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="row">
        <div className="left" onClick={() => {}}>
          <span className="left-text">댓글</span>
          <div onClick={() => setModalOpen(true)} style={{ display: "inline-block", cursor: "pointer" }}>
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
          maxLength={200}
        />
        <div 
          className="upload-button"
          style={{ pointerEvents: (isValidComment && !isSubmitting) ? "auto" : "none" }}
          onClick={isValidComment && !isSubmitting ? handleCommentSubmit : undefined}
        >
          <UploadIcon 
            fill={(isValidComment && !isSubmitting) ? "#2C9CDB" : "#939393"} 
            style={{ cursor: (isValidComment && !isSubmitting) ? "pointer" : "default" }}
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
            또한, 지나친 비방이나 욕설이 포함된 댓글은
            <br />
            임의로 삭제될 수 있어요.
          </>
        }
      />
    </div>
  );
}

export default CommentInput;
