import { useState, useEffect } from "react";
import "./commentInput.css";
import { UploadIcon, InfoIcon } from "../components/Icons";
import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import InfoModal from "../components/popup";

function CommentInput({ userUUID, setRefresh, refresh }) { 
    const [text, setText] = useState("");
    // 기본값은 localStorage에 미리 저장된 값 또는 하드코딩된 기본 프로필 URL
    const [userName, setUserName] = useState("익명 유령");
    const [userProfile, setUserProfile] = useState("/default_profile.webp");
    const [commentCount, setCommentCount] = useState(0);

    // 🔥 여기서 modalOpen, setModalOpen을 선언
    const [modalOpen, setModalOpen] = useState(false);

    // localStorage에서 사용자 정보 읽어오기
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
            const updatedName = localStorage.getItem("Fandex_userName") || userName;
            const updatedProfile = localStorage.getItem("Fandex_userProfile") || "/default_profile.webp";
            await addDoc(commentRef, {
                authorUid: userUUID,
                displayName: updatedName,
                profileImage: updatedProfile,
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
