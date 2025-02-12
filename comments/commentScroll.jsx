import { useState } from "react";
import "./commentScroll.css";
import { DefaultProfileIcon } from "../components/Icons";
import { ThumbUp, ThumbDown } from "../components/Icons";

function CommentScroll() {
    return(
        <>
          <SortButtons/>
          <CommentList/>
        </>
    )
}

// 정렬 버튼
const SortButtons = () => {
    const [active, setActive] = useState("popular");
  
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


  //댓글 창
  const CommentList = () => {
    const [comments, setComment] = useState([0,1,2]);

    return(
      <div>
        {comments.map((a, i) => (
            <Comments key={i} />
        ))}
      </div>
    )

  }


// 댓글
const Comments = () => {
    const [userName, setUserName] = useState("Username");
    const [dateTime, setDateTime] = useState("2025.02.21 12:31");
    const [content, setContent] = useState("댓글 내용");
    const [thumbUp, setThumbUp] = useState("32");
    const [thumbDown, setThumbDown] = useState("32");

    return(
        <div className="comment-container">
            <DefaultProfileIcon/>
            <div id="comment">
                <div className="comment-title">
                    <span id="username">{userName}</span>·<span id="date-time">{dateTime}</span>
                </div>
                <div className="comment-content">
                    <span>{content}</span>
                </div>
                <div className="comment-thumb">
                    <ThumbUp/>  <span>{thumbUp}</span>
                    <ThumbDown/> <span>{thumbDown}</span>
                </div>
            </div>
        </div>
    )

}


export default CommentScroll;
