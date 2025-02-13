import { useState, useEffect } from "react";
import "./commentInput.css"; // CSS 파일 임포트
import { UploadIcon, InfoIcon } from "../components/Icons";

import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"; // Firestore 관련 메서드


function CommentInput({ userUUID, setRefresh }) { // 🔹 setRefresh를 props로 받아옴
    // 입력 텍스트
    const [text, setText] = useState("");
    const [userName, setUserName] = useState("익명 유령");

    // 유저네임 가져오는 비동기 과정
    useEffect(() => {
        const fetchUserName = async () => {
            if (!userUUID) return; // userUUID가 없으면 실행 X

            try {
                const userDocRef = doc(db, "users", userUUID);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUserName(userDocSnap.data().displayName);
                } else {
                    setUserName("익명 유령");
                }
            } catch (error) {
                console.error("유저 이름을 가져오는 중 오류 발생:", error);
            }
        };

        fetchUserName();
    }, [userUUID]);

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
                displayName: userName, // 🔹 Firestore에서 가져온 `displayName`
                context: text, // 🔹 댓글 내용
                createdAt: serverTimestamp(), // 🔹 Firestore 서버 시간을 저장
                싫어요: 0, // 🔹 초기 싫어요 수
                좋아요: 0, // 🔹 초기 좋아요 수
                likedBy: [], // 좋아요 누른 유저 UUID 리스트
                dislikedBy: [] // 싫어요 누른 유저 UUID 리스트 
            });

            console.log("댓글이 성공적으로 저장되었습니다!");
            setText(""); // 댓글 입력 필드 초기화
            setRefresh(prev => !prev); // 🔹 refresh 상태 변경하여 `CommentList` 재렌더링
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
