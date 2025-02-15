import React from "react";
import Modal from "react-modal";

// 화면 전체를 덮고, 텍스트를 중앙에 배치하기 위한 스타일
const customModalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9999,
  },
  content: {
    // content 영역을 투명 & 전체 화면으로 설정
    backgroundColor: "transparent",
    border: "none",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    margin: 0,
    // Flex로 가운데 정렬
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

function InfoModal({ isOpen, onRequestClose, message }) {
  // 전체 content 클릭 시 모달 닫기
  const handleClick = () => {
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customModalStyles}
      ariaHideApp={false}
      contentLabel="Info Modal"
      shouldCloseOnOverlayClick={false} // overlay 클릭은 content에 포함되어 있으므로 false
    >
      {/* content 전체에 onClick 설정 */}
      <div
        style={{
          width: "100%",
          height: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={handleClick}
      >
        {/* 내부 텍스트 영역에 좌우 padding 적용 */}
        <div
          style={{
            boxSizing: "border-box",
            width: "100%",
            padding: "0 35px", // 좌우 18px padding -> 전체 36px 여백 효과
            color: "white",
            fontFamily: "SUITE Variable",
            textAlign: "center",
            fontSize: "18px",
            fontStyle: "normal",
            fontWeight: "700",
            lineHeight: "24px",
          }}
        >
          {message}
        </div>
      </div>
    </Modal>
  );
}


export default InfoModal;
