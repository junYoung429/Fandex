import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./CenterScroll.css";

// 파이어베이스 임포트
import { db } from "../src/firebase-config"; 
import { collection, getDocs } from "firebase/firestore";
import { RightArrow, LeftArrow } from "../components/Icons";

function CenterMode({ currentTargetId, setCurrentTargetId }) {
  const [items, setItems] = useState([]);
  const sliderRef = useRef(null);

  // 파이어베이스에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "voteResults"));
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        affiliate: doc.data().affiliate, // affiliate 필드 추가
        ...doc.data()
      }));
      setItems(fetchedItems);
    };

    fetchData();
  }, []);

  const settings = {
    className: "center",
    centerMode: true,
    infinite: true,
    centerPadding: "10px",
    slidesToShow: 3,
    speed: 500,
    arrows: true, // 화살표 활성화
    nextArrow: <RightArrow />,
    prevArrow: <LeftArrow />,
    afterChange: () => {
      // 슬라이드 변경 후, DOM에서 slick-center 요소를 찾아 data-id 읽기
      const centerSlide = document.querySelector('.slick-center .circle');
      if (centerSlide) {
        const currentId = centerSlide.getAttribute("data-id");
        if (currentId) {
          setCurrentTargetId(currentId);
        }
      }
    }
  };

  // 처음 items가 로드된 후, 초기 center 요소의 id를 설정
  useEffect(() => {
    if (items.length > 0) {
      // DOM 렌더링 완료 후 실행 (약간의 딜레이를 줌)
      setTimeout(() => {
        const centerSlide = document.querySelector('.slick-center .circle');
        if (centerSlide) {
          const currentId = centerSlide.getAttribute("data-id");
          if (currentId) {
            setCurrentTargetId(currentId);
          }
        }
      }, 100);
    }
  }, [items, setCurrentTargetId]);

  return (
    <div className="slider-viewport">
      <Slider ref={sliderRef} {...settings}>
        {items.map((item) => (
          <div key={item.id}>
            {/* 각 circle에 data-id 속성 추가 */}
            <div className="circle" data-id={item.id}>
              <h3>{item.affiliate}</h3>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CenterMode;
