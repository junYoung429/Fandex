import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import { VictoryPie } from "victory";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./CenterScroll.css";

// 파이어베이스 임포트
import { db } from "../src/firebase-config"; 
import { collection, getDocs } from "firebase/firestore";
import { RightArrow, LeftArrow } from "../components/Icons";

// Indicator 컴포넌트 임포트
import Indicator from "../test/Indicator";

// 도넛 차트 + 중앙 이미지 컴포넌트
function DonutChartWithCenterImage({ imageUrl }) {
  // 예시 데이터 (필요에 따라 수정)
  const data = [
    { x: "A", y: 50 },
    { x: "B", y: 50 }
  ];
  
  // 슬라이더 내에서 사용할 크기에 맞게 조정 (약간 크게 보여서 벗어나 보이게)
  const chartSize = 120;
  const innerRadius = 50;
  const centerImageSize = 80;
  
  return (
    <div style={{ position: "relative", width: chartSize, height: chartSize }}>
      <VictoryPie
        data={data}
        innerRadius={innerRadius}
        width={chartSize}
        height={chartSize}
        colorScale={["#7D6CF6", "#B3CE1F"]}

        style={{
          parent: {
            position: "absolute",
            top: 0,
            left: 0
          },
          labels: { display: "none" } // 필요 시 라벨 제거
        }}
      />
      <img
        src={imageUrl}
        alt="Center"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: centerImageSize,
          height: centerImageSize,
          objectFit: "cover",
          borderRadius: "50%"
        }}
      />
    </div>
  );
}

function CenterMode({ currentTargetId, setCurrentTargetId }) {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  // 파이어베이스에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "voteResults"));
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        imageUrl: doc.data().imageUrl, // imageUrl 필드 추가
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
    centerPadding: "80px",
    slidesToShow: 1,
    speed: 500,
    arrows: true, // 화살표 활성화
    nextArrow: <RightArrow />,
    prevArrow: <LeftArrow />,
    afterChange: (index) => {
      const currentId = items[index]?.id;
      if (currentId) {
        setCurrentTargetId(currentId);
        setCurrentIndex(index);
      }
    }
  };

  // 처음 items가 로드된 후, 초기 center 요소의 id를 설정
  useEffect(() => {
    if (items.length > 0) {
      // DOM 렌더링 완료 후 실행 (약간의 딜레이)
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

        <div className="left-gradient"></div>
        <div className="right-gradient"></div>

      <Indicator total={items.length} currentIndex={currentIndex} />
      <Slider ref={sliderRef} {...settings}>
        {items.map((item) => (
          <div key={item.id}>
            {/* 각 circle에 data-id 속성 추가 */}
            <div className="circle" data-id={item.id}>
              <DonutChartWithCenterImage imageUrl={item.imageUrl} />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CenterMode;
