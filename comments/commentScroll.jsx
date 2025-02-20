import { useEffect, useState } from "react";
import "./commentScroll.css";
import { ThumbUp, ThumbDown } from "../components/Icons";
import { db } from "../src/firebase-config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

function CommentScroll({ userUUID, currentTargetId }) {
  const [sortOrder, setSortOrder] = useState("latest");

  return (
    <>
      <SortButtons setSortOrder={setSortOrder} />
      <CommentList
        userUUID={userUUID}
        sortOrder={sortOrder}
        currentTargetId={currentTargetId}
      />
    </>
  );
}

const SortButtons = ({ setSortOrder }) => {
  const [active, setActive] = useState("latest");
  return (
    <div className="sort-container">
      <button
        className={`sort-button ${active === "popular" ? "active" : ""}`}
        onClick={() => {
          setActive("popular");
          setSortOrder("popular");
        }}
      >
        인기순
      </button>
      <button
        className={`sort-button ${active === "latest" ? "active" : ""}`}
        onClick={() => {
          setActive("latest");
          setSortOrder("latest");
        }}
      >
        최신순
      </button>
    </div>
  );
};

const CommentList = ({ userUUID, sortOrder, currentTargetId }) => {
  const [allComments, setAllComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // onSnapshot을 사용하여 실시간으로 최신순(createdAt 내림차순) 데이터를 구독
  useEffect(() => {
    if (!currentTargetId) return;

    const commentsRef = collection(
      db,
      "voteResults",
      currentTargetId,
      "comments"
    );
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error("댓글 실시간 업데이트 중 오류 발생:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentTargetId]);

  // 클라이언트에서 정렬: 이미 받아온 allComments 배열을 기준으로 정렬
  const sortedComments = [...allComments].sort((a, b) => {
    if (sortOrder === "latest") {
      // 최신순: createdAt 내림차순
      return b.createdAt?.toDate() - a.createdAt?.toDate();
    } else {
      // 인기순: 좋아요 수 내림차순
      return (b.좋아요 || 0) - (a.좋아요 || 0);
    }
  });

  if (loading) {
    return <div className="loading">로딩중...</div>;
  }

  return (
    <div>
      {sortedComments.length > 0 ? (
        sortedComments.map((comment) => (
          <Comments
            key={comment.id}
            comment={comment}
            userUUID={userUUID}
            currentTargetId={currentTargetId}
          />
        ))
      ) : (
        <>
          <div className="no-comments">
            <img
              src="/horse.png"
              alt="말 이미지"
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
          </div>
          <p className="no-comments"> 아직 아무 말도 없어요.</p>
          <div className="spacer"></div>
        </>
      )}
      <div style={{ height: "30px" }}></div>
    </div>
  );
};

const Comments = ({ comment, userUUID, currentTargetId }) => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
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
      const commentRef = doc(
        db,
        "voteResults",
        currentTargetId,
        "comments",
        comment.id
      );
      const commentSnap = await getDoc(commentRef);
      if (commentSnap.exists()) {
        const data = commentSnap.data();
        if (type === "like") {
          if (data.likedBy?.includes(userUUID)) {
            await updateDoc(commentRef, {
              좋아요: increment(-1),
              likedBy: arrayRemove(userUUID),
            });
            setLiked(false);
          } else {
            await updateDoc(commentRef, {
              좋아요: increment(1),
              싫어요: data.dislikedBy?.includes(userUUID)
                ? increment(-1)
                : increment(0),
              likedBy: arrayUnion(userUUID),
              dislikedBy: arrayRemove(userUUID),
            });
            setLiked(true);
            setDisliked(false);
          }
        } else if (type === "dislike") {
          if (data.dislikedBy?.includes(userUUID)) {
            await updateDoc(commentRef, {
              싫어요: increment(-1),
              dislikedBy: arrayRemove(userUUID),
            });
            setDisliked(false);
          } else {
            await updateDoc(commentRef, {
              싫어요: increment(1),
              좋아요: data.likedBy?.includes(userUUID)
                ? increment(-1)
                : increment(0),
              dislikedBy: arrayUnion(userUUID),
              likedBy: arrayRemove(userUUID),
            });
            setDisliked(true);
            setLiked(false);
          }
        }
        // onSnapshot을 사용하고 있으므로, 댓글 업데이트는 실시간 반영됨.
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
        style={{
          width: "32px",
          height: "32px",
          marginTop: "4px",
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: "50%",
        }}
      />
      <div id="comment">
        <div className="comment-title">
          <span id="username">{comment.displayName}</span> ·{" "}
          <span id="date-time">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="comment-content">
          <span>{comment.context}</span>
        </div>
        <div className="comment-thumb">
          <ThumbUp
            onClick={() => handleVote("like")}
            fill={liked ? "#B3CE1F" : "white"}
          />{" "}
          <span>{comment.좋아요}</span>
          <ThumbDown
            onClick={() => handleVote("dislike")}
            fill={disliked ? "#7D6CF6" : "white"}
          />{" "}
          <span>{comment.싫어요}</span>
        </div>
      </div>
    </div>
  );
};

const formatDate = (timestamp) => {
  if (!timestamp) return "날짜 없음";
  const date = timestamp.toDate();
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
};

export default CommentScroll;
