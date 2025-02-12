import React from "react";

const Popup = ({ onClose }) => {
  return (
    // 팝업 오버레이 전체에 onClick 이벤트를 부여하여 클릭 시 onClose 실행
    <div className="popup-container" onClick={onClose}>
      <div className="popup-content">
        <p>
          댓글은 수정 또는 삭제가 불가하니
          신중하게 작성해 주세요. <br />
          또한, 지나친 비방이나 욕설이 포함된 댓글은
          임의로 삭제될 수 있어요.
        </p>
      </div>
    </div>
  );
};
  
  export default Popup;
  