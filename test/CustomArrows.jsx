import React from "react";
import "./CustomArrows.css"; // ✅ CSS 파일에서 스타일 적용
import leftArrow from "/public/arrow_left.png"; // 🔄 왼쪽 화살표 이미지
import rightArrow from "/public/arrow_right.png"; // 🔄 오른쪽 화살표 이미지

// ✅ 이전 화살표 버튼 (왼쪽)
export const PrevArrow = (props) => {
  return (
    <div className="custom-arrow prev-arrow" onClick={props.onClick}>
      <img src={leftArrow} alt="Prev" style={{ width: "5px", height: "10px" }} />
    </div>
  );
};

// ✅ 다음 화살표 버튼 (오른쪽)
export const NextArrow = (props) => {
  return (
    <div className="custom-arrow next-arrow" onClick={props.onClick}>
      <img src={rightArrow} alt="Next" style={{ width: "5px", height: "10px" }} />
    </div>
  );
};
