import React, { useEffect, useState, useRef } from "react";
import Slider from "react-slick";
import { VictoryPie } from "victory";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./CenterScroll.css";

import { db } from "../src/firebase-config"; 
import { doc, getDoc } from "firebase/firestore";
import { RightArrow, LeftArrow } from "../components/Icons";
import Indicator from "./Indicator";
import { STATIC_TARGETS } from "../utils/targets";

function DonutChartWithCenterImage({ imageUrl, data }) {
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
          parent: { position: "absolute", top: 0, left: 0 },
          labels: { display: "none" }
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
  // STATIC_TARGETS를 기반으로 items 상태를 설정
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  // 각 타겟에 대해 Firestore에서 voteResults 문서를 가져와 STATIC_TARGETS와 병합
  useEffect(() => {
    const fetchChartData = async () => {
      // STATIC_TARGETS 배열을 기반으로, 각 타겟에 대해 Firestore 문서를 가져옴
      const updatedTargets = await Promise.all(
        STATIC_TARGETS.map(async (target) => {
          try {
            const docRef = doc(db, "voteResults", target.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              // 차트 데이터(예: 유효_응원해요, 유효_아쉬워요)를 병합하여 반환
              return { ...target, ...docSnap.data() };
            }
          } catch (error) {
            console.error(`Error fetching data for target ${target.id}:`, error);
          }
          return target; // 문서를 찾지 못하면 기본 STATIC_TARGETS 데이터만 사용
        })
      );
      setItems(updatedTargets);
    };

    fetchChartData();
  }, []);

  const settings = {
    className: "center",
    centerMode: true,
    infinite: true,
    centerPadding: "80px",
    slidesToShow: 1,
    speed: 500,
    arrows: true,
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

  // 초기 center 요소의 id 설정 (선택적)
  useEffect(() => {
    if (items.length > 0) {
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
              <DonutChartWithCenterImage 
                imageUrl={item.imageUrl} 
                data={[
                  { x: "아쉬워요", y: item.유효_아쉬워요 || 0 },
                  { x: "응원해요", y: item.유효_응원해요 || 0 },
                ]}
              />
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CenterMode;
