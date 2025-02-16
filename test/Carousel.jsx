import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css"
import DonutChartWithImage from "./DonutChartWithImage";
import { PrevArrow, NextArrow } from "./CustomArrows";

// ✅ 경고 방지를 위한 Wrapper
const SlickButtonFix = ({ currentSlide, slideCount, children, ...props }) => (
  <span {...props}>{children}</span>
);

export default function SimpleSlider() {
  const [activeIndex, setActiveIndex] = useState(null);
  const sliderRef = React.useRef(null);  // Slider 참조 추가

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
            {[
              { name: "최재원" },
              { name: "최재원" },
              { name: "문진서" },
              { name: "임지희" }
            ].map((person, index) => ( 
              <div 
                key={index}
                className={`slide-page ${activeIndex === index ? "active" : ""}`} 
              >
                <div className="donut">
                  <div className="donut-chart">
                    <DonutChartWithImage />
                  </div>
                </div>
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
