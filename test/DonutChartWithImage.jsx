import React, { useState, useEffect } from "react";
import { VictoryPie } from "victory";

const DonutChartWithImage = ({ profileImage, voteData }) => {
  const [chartSize, setChartSize] = useState(Math.min(window.innerWidth * 0.4, 200)); // ✅ 반응형 크기 설정

  useEffect(() => {
    const handleResize = () => {
      setChartSize(Math.min(window.innerWidth * 0.4, 200)); // ✅ 화면 크기에 따라 조정
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const innerRadius = chartSize * 0.4; // ✅ 도넛 구멍 크기 비율 설정
  const imageSize = innerRadius * 2.0; // ✅ 이미지 크기를 도넛 구멍 크기에 맞춤

  // 투표 데이터 계산
  const total = (voteData?.응원해요 || 0) + (voteData?.아쉬워요 || 0);
  const supportPercentage = total > 0 ? (voteData?.응원해요 || 0) / total * 100 : 50;
  const regretPercentage = total > 0 ? (voteData?.아쉬워요 || 0) / total * 100 : 50;

  return (
    <svg width={chartSize} height={chartSize}>
      {/* 도넛 차트 */}
      <VictoryPie
        standalone={false} // SVG 내부에서 사용하기 위해 standalone 비활성화
        data={[
          { x: "응원해요", y: supportPercentage },
          { x: "아쉬워요", y: regretPercentage },
        ]}
        width={chartSize}
        height={chartSize}
        innerRadius={chartSize * 0.4} // ✅ 반응형 도넛 구멍 크기
        radius={chartSize * 0.5} // ✅ 반응형 외부 반지름
        colorScale={["#B3CE1F", "#7D6CF6"]}
      />

      {/* 중앙 이미지 (정확히 도넛 구멍에 배치) */}
      <image
        href={profileImage || "/public/default_profile.webp"}
        x={(chartSize / 2) - (imageSize / 2)} // ✅ 중앙 정렬 공식 적용
        y={(chartSize / 2) - (imageSize / 2)}
        width={imageSize}
        height={imageSize}
        clipPath="circle(50%)" // ✅ 원형 클리핑
      />
    </svg>
  );
};

export default DonutChartWithImage;
