import { useState, useEffect } from "react";
import "./commentInput.css";
import { UploadIcon, InfoIcon } from "../components/Icons";
import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

function CommentInput({ userUUID, setRefresh, refresh }) { 
  const [text, setText] = useState("");
  // 기본값은 localStorage에 미리 저장된 값 또는 하드코딩된 기본 프로필 URL
  const [userName, setUserName] = useState("익명 유령");
  const [userProfile, setUserProfile] = useState("https://firebasestorage.googleapis.com/v0/b/fandextest.firebasestorage.app/o/default_profile.png?alt=media&token=023bd283-c2ec-47e7-84c4-4522c0142c53");
  const [commentCount, setCommentCount] = useState(0);

  // localStorage에서 사용자 정보 읽어오기
  useEffect(() => {
    if (!userUUID) return;
    const storedName = localStorage.getItem("Fandex_userName");
    const storedProfile = localStorage.getItem("Fandex_userProfile");
    if (storedName) setUserName(storedName);
    if (storedProfile) setUserProfile(storedProfile);
  }, [userUUID]);

  // 댓글 개수 가져오기
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const commentRef = collection(db, "voteResults", "투표대상1", "comments");
        const snapshot = await getDocs(commentRef);
        setCommentCount(snapshot.size);
      } catch (error) {
        console.error("댓글 개수를 불러오는 중 오류 발생:", error);
      }
    };
    fetchCommentCount();
  }, [refresh]);

  const isValidComment = text.length >= 10; 

  const handleCommentSubmit = async () => {
    if (text.length < 10 || text.length > 200) {
      alert("댓글은 10자 이상 200자 이하로 작성해주세요.");
      return;
    }
    try {
      console.log("댓글 저장 시도 중...");
      const commentRef = collection(db, "voteResults", "투표대상1", "comments");
      // denormalization: localStorage 또는 state에 있는 사용자 정보를 바로 포함
      await addDoc(commentRef, {
        authorUid: userUUID,
        displayName: userName,
        profileImage: userProfile,
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
          <InfoIcon/>
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
    </div>
  );
}

export default CommentInput;
