import { useState } from "react";
import "./commentInput.css"; // CSS 파일 임포트
import { UploadIcon, InfoIcon } from "../components/Icons";

import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Firestore 관련 메서드


function CommentInput({ userUUID }) {
    // 입력 텍스트
    const [text, setText] = useState("");

    //댓글이 10자 이상인지 여부 확인
    const isValidComment = text.length >= 10; 

    // Firestore에 댓글 추가하는 함수
    const handleCommentSubmit = async () => {
        if (text.length < 10 || text.length > 200) {
            alert("댓글은 10자 이상 200자 이하로 작성해주세요.");
            return;
        }

        try {
            console.log("댓글 저장 시도 중..."); // ✅ 실행 확인

            // ✅ Firestore에 `voteResults` → 특정 `투표대상1` → `comments` 하위 컬렉션에 추가
            const commentRef = collection(db, "voteResults", "투표대상1", "comments");
            
            await addDoc(commentRef, {
                authorUid: userUUID, // 🔹 댓글 작성자의 UUID
                context: text, // 🔹 댓글 내용
                createdAt: serverTimestamp(), // 🔹 Firestore 서버 시간을 저장
                싫어요: 0, // 🔹 초기 싫어요 수
                좋아요: 0, // 🔹 초기 좋아요 수
            });

            console.log("댓글이 성공적으로 저장되었습니다!");
            setText(""); // 댓글 입력 필드 초기화
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
                <span className="right-text">nn개</span>
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
                    style={{
                        pointerEvents: isValidComment ? "auto" : "none", // 10자 미만이면 클릭 차단
                    }}
                    onClick={isValidComment ? handleCommentSubmit : undefined} // ✅ 조건부 클릭 적용
                >
                    <UploadIcon 
                        fill={isValidComment ? "#2C9CDB" : "#939393"} 
                        style={{ cursor: isValidComment ? "pointer" : "default" }} // ✅ 클릭 가능 시 포인터 변경
                    />
                </div>            
            </div>
                  
        </div>
    );
}


export default CommentInput;
