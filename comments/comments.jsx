import { useState } from "react";
import "./comments.css"; // CSS 파일 임포트

function Comments() {
    const [text, setText] = useState("");

    return (
        <div>
            <div className="input-wrapper">
            <textarea
                    className="comment"
                    placeholder="댓글은 10자 이상 200자 이하로 작성해주세요."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <UploadIcon />
            </div>
        </div>
    );
}

function UploadIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
   
            viewBox="0 0 20 20"
            className="upload-icon"
        >
            <path d="M9 14H11V9.8L12.6 11.4L14 10L10 6L6 10L7.4 11.4L9 9.8V14ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z"/>
        </svg>
    );
}

export default Comments;
