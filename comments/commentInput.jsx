import { useState } from "react";
import "./commentInput.css"; // CSS 파일 임포트
import { UploadIcon, InfoIcon } from "../components/Icons";
import Popup from "../components/popup";

function CommentInput() {
    // 입력 텍스트
    const [text, setText] = useState("");
    
    // Popup 표시 여부를 관리하는 상태
    const [showPopup, setShowPopup] = useState(false);

    return (
        <div>
            <div className="row">
                <div className="left" onClick={() => setShowPopup(true)}>
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
                <UploadIcon />
            </div>
                  
            {/* 팝업을 body에 직접 추가하여 전체 화면을 덮도록 함 */}
            {showPopup && <Popup onClose={() => setShowPopup(false)} />}
        </div>
    );
}


export default CommentInput;
