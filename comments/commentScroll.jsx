import { useEffect, useState } from "react";
import "./commentScroll.css";
import { DefaultProfileIcon, ThumbUp, ThumbDown } from "../components/Icons";
import { db } from "../src/firebase-config"; // 🔹 Firestore 설정 불러오기
import { collection, getDocs, doc, getDoc, query, orderBy, updateDoc, increment, arrayUnion, arrayRemove  } from "firebase/firestore";
import HorseImage from "../storage/horse";

function CommentScroll({ userUUID, refresh, setRefresh }) {
  return (
      <>
        <SortButtons/>
        <CommentList userUUID={userUUID} refresh={refresh} setRefresh={setRefresh} />
      </>
  );
}

// 정렬 버튼
const SortButtons = () => {
    const [active, setActive] = useState("latest");
  
    return (
      <div className="sort-container">
        <button
          className={`sort-button ${active === "popular" ? "active" : ""}`}
          onClick={() => setActive("popular")}
        >
          인기순
        </button>
        <button
          className={`sort-button ${active === "latest" ? "active" : ""}`}
          onClick={() => setActive("latest")}
        >
          최신순
        </button>
      </div>
    );
  };


// ✅ 댓글 리스트 컴포넌트 (Firestore에서 데이터 가져오기)
const CommentList = ({ userUUID, refresh, setRefresh }) => {
  const [comments, setComments] = useState([]); // 🔹 Firestore에서 가져온 댓글 저장
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
      const fetchComments = async () => {
          try {
              const commentsRef = collection(db, "voteResults", "투표대상1", "comments");
              const q = query(commentsRef, orderBy("createdAt", "desc")); // 🔹 최신순 정렬(desc)
              const querySnapshot = await getDocs(q);

              const commentsData = [];

              for (const docSnap of querySnapshot.docs) {
                  let commentData = docSnap.data();
                  
                  // 🔹 Firestore users 컬렉션에서 `authorUid` 기반으로 displayName 가져오기
                  const userDocRef = doc(db, "users", commentData.authorUid);
                  const userDocSnap = await getDoc(userDocRef);
                  
                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    commentData.displayName = userData.displayName;
                    commentData.profileImage = userData.profileImage; // 🔥 여기 추가

                  } else {
                      commentData.displayName = "익명 유령";
                      <DefaultProfileIcon />
                  }

                  commentsData.push({ id: docSnap.id, ...commentData });
              }

              setComments(commentsData);
          } catch (error) {
              console.error("댓글을 불러오는 중 오류 발생:", error);
          } finally {
            setLoading(false); // 데이터 로드 완료 후 로딩 상태 변경
          }
      };

      fetchComments();
    }, [refresh]); // 🔹 refresh 값이 변경될 때마다 실행

  if (loading) {
    // 데이터가 로드 중이면 로딩 UI나 아무것도 표시하지 않도록 처리
    return <div className="loading">로딩중...</div>;
  }

  return (
      <div>
          {comments.length > 0 ? (
              comments.map((comment) => (
                  <Comments key={comment.id} comment={comment} userUUID={userUUID} setRefresh={setRefresh}/>
              ))
          ) : (
            <>
              <div className="no-comments">
                <HorseImage imagePath="horse.png"/>
              </div>
              <p className="no-comments"> 아직 댓글이 없습니다.</p>
              
              <div className="spacer"> </div>
            </>
          )}
      </div>
  );
};


const Comments = ({ comment, setRefresh, userUUID }) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
      // 🔹 Firestore에서 현재 유저가 좋아요/싫어요를 눌렀는지 확인하는 로직
      if (comment.likedBy?.includes(userUUID)) {
          setLiked(true);
          setDisliked(false);
      } else if (comment.dislikedBy?.includes(userUUID)) {
          setLiked(false);
          setDisliked(true);
      } else {
          setLiked(false);
          setDisliked(false);
      }
  }, [comment, userUUID]);

  const handleVote = async (type) => {
    if (!comment.id || !userUUID) return;

    try {
        const commentRef = doc(db, "voteResults", "투표대상1", "comments", comment.id);
        const commentSnap = await getDoc(commentRef);

        if (commentSnap.exists()) {
            const data = commentSnap.data();

            if (type === "like") {
                if (data.likedBy?.includes(userUUID)) {
                    // 🔴 이미 좋아요를 누른 상태면 취소
                    await updateDoc(commentRef, {
                        좋아요: increment(-1),
                        likedBy: arrayRemove(userUUID)
                    });
                    setLiked(false);
                } else {
                    // ✅ 좋아요 추가 + 싫어요 취소
                    await updateDoc(commentRef, {
                        좋아요: increment(1),
                        싫어요: data.dislikedBy?.includes(userUUID) ? increment(-1) : increment(0), // 싫어요 취소
                        likedBy: arrayUnion(userUUID),
                        dislikedBy: arrayRemove(userUUID)
                    });
                    setLiked(true);
                    setDisliked(false);
                }
            } else if (type === "dislike") {
                if (data.dislikedBy?.includes(userUUID)) {
                    // 🔴 이미 싫어요를 누른 상태면 취소
                    await updateDoc(commentRef, {
                        싫어요: increment(-1),
                        dislikedBy: arrayRemove(userUUID)
                    });
                    setDisliked(false);
                } else {
                    // ✅ 싫어요 추가 + 좋아요 취소
                    await updateDoc(commentRef, {
                        싫어요: increment(1),
                        좋아요: data.likedBy?.includes(userUUID) ? increment(-1) : increment(0), // 좋아요 취소
                        dislikedBy: arrayUnion(userUUID),
                        likedBy: arrayRemove(userUUID)
                    });
                    setDisliked(true);
                    setLiked(false);
                }
            }

            setRefresh(prev => !prev); // ✅ 댓글 리스트 갱신
        }
    } catch (error) {
        console.error("좋아요/싫어요 업데이트 중 오류 발생:", error);
    }
  };

  return (
      <div className="comment-container">
        <img 
           src={comment.profileImage} 
          alt="프로필 이미지" 
          style={{ width: "32px", height: "32px", marginTop: "4px"}}
        />
          <div id="comment">
              <div className="comment-title">
                  <span id="username">{comment.displayName}</span> · <span id="date-time">{formatDate(comment.createdAt)}</span>
              </div>
              <div className="comment-content">
                  <span>{comment.context}</span>
              </div>
              <div className="comment-thumb">
                    <ThumbUp 
                        onClick={() => handleVote("like")} 
                        fill={liked ? "#2C9CDB" : "white"}  
                    /> 
                    <span>{comment.좋아요}</span>

                    <ThumbDown 
                        onClick={() => handleVote("dislike")} 
                        fill={disliked ? "#2C9CDB" : "white"} 
                    /> 
                    <span>{comment.싫어요}</span>
              </div>
          </div>
      </div>
  );
};


// ✅ Firestore의 `createdAt` 타임스탬프를 `YYYY.MM.DD HH:mm` 형식으로 변환
const formatDate = (timestamp) => {
  if (!timestamp) return "날짜 없음";
  const date = timestamp.toDate(); // Firestore Timestamp -> JavaScript Date 변환
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

export default CommentScroll;
