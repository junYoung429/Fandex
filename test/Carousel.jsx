import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css"
import DonutChartWithImage from "./DonutChartWithImage";
import { PrevArrow, NextArrow } from "./CustomArrows";
import { db } from "../src/firebase-config";
import { collection, getDocs } from "firebase/firestore";

// ✅ 경고 방지를 위한 Wrapper
const SlickButtonFix = ({ currentSlide, slideCount, children, ...props }) => (
  <span {...props}>{children}</span>
);

export default function SimpleSlider({ currentTargetId, setCurrentTargetId }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const sliderRef = React.useRef(null);
  const [candidates, setCandidates] = useState([]);

  // Firebase에서 후보자 데이터 가져오기
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const candidatesRef = collection(db, "voteResults");
        const snapshot = await getDocs(candidatesRef);
        const candidatesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCandidates(candidatesList);

        // 초기 currentTargetId 설정 (첫 번째 후보)
        if (candidatesList.length > 0 && !currentTargetId) {
          setCurrentTargetId(candidatesList[0].id);
        }
      } catch (error) {
        console.error("후보자 데이터 가져오기 실패:", error);
      }
    };

    fetchCandidates();
  }, [currentTargetId, setCurrentTargetId]);

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 500);
  }, []);

  const next = () => {
    sliderRef.current.slickNext();
  };

  const previous = () => {
    sliderRef.current.slickPrev();
  };

  var settings = {
    className: "center",
    centerMode: true,
    centerPadding: "15%",
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1, // ← 명시적으로 추가
    arrows: false,
    beforeChange: () => setActiveIndex(null),
    afterChange: (current) => {
      // 슬라이드 변경 시 currentTargetId 업데이트
      if (candidates[current]) {
        setCurrentTargetId(candidates[current].id);
      }
    },
    accessibility: false,
    focusOnSelect: false,
    swipe: true,
    useCSS: true,
    useTransform: true,
    waitForAnimate: false
  };

  return (
    <div className="slider-wrapper">
      <div className="slider-row">
        <div className="arrow-button prev-button" onClick={previous}>
          <PrevArrow />
        </div>
        
        <div className="slider-container">
          <Slider ref={sliderRef} {...settings}>
            {candidates.map((candidate, index) => ( 
              <div 
                key={candidate.id}
                className={`slide-page ${activeIndex === index ? "active" : ""}`} 
              >
                <div className="donut">
                  <div className="donut-chart">
                    <DonutChartWithImage 
                      profileImage={candidate.profileImage}
                      voteData={candidate.voteData} // 투표 데이터 전달
                    />
                  </div>
                </div>
                <div className="group">{candidate.affiliate}</div>
                <div className="name">{candidate.name}</div>
              </div>
            ))}
          </Slider>
        </div>

        <div className="arrow-button next-button" onClick={next}>
          <NextArrow />
        </div>
      </div>
    </div>
  );
}
