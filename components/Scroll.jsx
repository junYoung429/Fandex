"use client"

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { RightArrow, LeftArrow } from "../components/Icons"
import "./Scroll.css"

// ✅ 인디케이터 컴포넌트
import Indicator from "../test/Indicator";

export default function ScrollLinked() {
  const ref = useRef(null);
  const { scrollXProgress } = useScroll({ container: ref });
  const maskImage = useScrollOverflowMask(scrollXProgress);

  // 기본 아이템 배열
  const items = [
    { id: 1, color: "#ff0088" },
    { id: 2, color: "#dd00ee" },
    { id: 3, color: "#9911ff" },
    { id: 4, color: "#0d63f8" },
    { id: 5, color: "#0cdcf7" },
    { id: 6, color: "#4ff0b7" },
  ];

  // 무한 스크롤을 위해 앞뒤로 아이템 복제 (3번 반복)
  const duplicatedItems = [...items, ...items, ...items];

  // ✅ 인디케이터에서 활성화 표시할 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);

  // 마운트 시, "중간 세트"로 스크롤
  useEffect(() => {
    const ul = ref.current;
    if (!ul) return;

    const itemWidth = ul.scrollWidth / duplicatedItems.length;
    const oneSetWidth = itemWidth * items.length;
    ul.scrollLeft = oneSetWidth; // 중간 세트 시작점
  }, []);

  // 스크롤 이벤트로 현재 인덱스 계산
  useEffect(() => {
    const ul = ref.current;
    if (!ul) return;

    let timeoutId = null;
    const tolerance = 10;

    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);

      // 스크롤 멈춤 감지 후 150ms 뒤에 처리
      timeoutId = setTimeout(() => {
        const { scrollLeft, scrollWidth, clientWidth } = ul;
        const itemWidth = scrollWidth / duplicatedItems.length;
        const oneSetWidth = itemWidth * items.length;

        // 임시로 스냅 비활성화
        ul.style.scrollSnapType = "none";

        // 양끝 넘어가면 중간 세트로 되돌림
        if (scrollLeft < oneSetWidth - tolerance) {
          ul.style.scrollBehavior = "auto";
          ul.scrollLeft += oneSetWidth;
        } else if (scrollLeft > oneSetWidth * 2 + tolerance) {
          ul.style.scrollBehavior = "auto";
          ul.scrollLeft -= oneSetWidth;
        }

        // 가운데 아이템 인덱스 계산
        const middle = ul.scrollLeft + clientWidth / 2;
        const rawIndex = Math.floor(middle / itemWidth);
        let modIndex = rawIndex % items.length;
        if (modIndex < 0) modIndex += items.length;
        setCurrentIndex(modIndex);

        // 다시 스냅 활성화
        ul.style.scrollSnapType = "x mandatory";
        ul.style.scrollBehavior = "smooth";
      }, 150);
    };

    ul.addEventListener("scroll", handleScroll);
    return () => {
      ul.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // 인디케이터 dot 클릭 시, 해당 인덱스로 스크롤 이동
  const onDotClick = (index) => {
    const ul = ref.current;
    if (!ul) return;

    const itemWidth = ul.scrollWidth / duplicatedItems.length;
    const oneSetWidth = itemWidth * items.length;
    const targetScrollLeft = oneSetWidth + itemWidth * index;

    ul.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
  };

  // 다음/이전 버튼
  const scrollToNext = () => {
    const ul = ref.current;
    if (!ul) return;

    const ITEM_WIDTH = 200;
    const GAP = 20;
    const moveDistance = ITEM_WIDTH + GAP;

    ul.style.scrollSnapType = "none";
    ul.scrollBy({ left: moveDistance, behavior: "smooth" });
    setTimeout(() => {
      ul.style.scrollSnapType = "x mandatory";
    }, 500);
  };

  const scrollToPrev = () => {
    const ul = ref.current;
    if (!ul) return;

    const ITEM_WIDTH = 200;
    const GAP = 20;
    const moveDistance = ITEM_WIDTH + GAP;

    ul.style.scrollSnapType = "none";
    ul.scrollBy({ left: -moveDistance, behavior: "smooth" });
    setTimeout(() => {
      ul.style.scrollSnapType = "x mandatory";
    }, 500);
  };

  return (
    <div className="scroll-linked-root">
      {/* Progress 원형 표시 (optional) */}
      <div className="progress-wrapper">
        <svg className="progress" width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="30" pathLength="1" className="bg" />
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            className="indicator"
            style={{ pathLength: scrollXProgress }}
          />
        </svg>
      </div>

      {/* 인디케이터 */}
      <Indicator
        total={items.length}
        currentIndex={currentIndex}
        onDotClick={onDotClick}
      />

      {/* 스크롤 영역 */}
      <div className="scroll-container">
        <div className="scroll-arrow left" onClick={scrollToPrev}>
          <LeftArrow />
        </div>

        <motion.ul ref={ref} className="scroll-list" style={{ maskImage }}>
          {duplicatedItems.map((item, index) => (
            <li key={`${item.id}-${index}`} style={{ background: item.color }} />
          ))}
        </motion.ul>

        <div className="scroll-arrow right" onClick={scrollToNext}>
          <RightArrow />
        </div>
      </div>
    </div>
  );
}

/** 마스크 애니메이션 로직 (변경 없음) */
function useScrollOverflowMask(scrollXProgress) {
  const left = "0%";
  const right = "100%";
  const leftInset = "20%";
  const rightInset = "80%";
  const transparent = "#0000";
  const opaque = "#000";

  const maskImage = useMotionValue(
    `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
  );

  useMotionValueEvent(scrollXProgress, "change", (value) => {
    if (value === 0) {
      animate(
        maskImage,
        `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
      );
    } else if (value === 1) {
      animate(
        maskImage,
        `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${right}, ${opaque})`
      );
    } else if (
      scrollXProgress.getPrevious() === 0 ||
      scrollXProgress.getPrevious() === 1
    ) {
      animate(
        maskImage,
        `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`
      );
    }
  });

  return maskImage;
}
