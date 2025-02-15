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

// 파이어베이스 임포트
import { db } from "../src/firebase-config"; // 🔹 db import 추가!
import { collection, getDocs } from "firebase/firestore";

export default function ScrollLinked({ onCurrentItemChange }) {
  const ref = useRef(null);
  const { scrollXProgress } = useScroll({ container: ref });
  const maskImage = useScrollOverflowMask(scrollXProgress);

  // 기본 아이템 배열
  const [items, setItems] = useState([]);

  // 파이어베이스에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "voteResults"));
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        affiliate: doc.data().affiliate,  // affiliate 필드 추가
        ...doc.data()
      }));
      setItems(fetchedItems);
    };

    fetchData();
  }, []);

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
  }, [items]);

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

        // 현재 아이템 ID를 부모 컴포넌트로 전달
        if (onCurrentItemChange) {
          onCurrentItemChange(
            items[modIndex].id,
            items[modIndex].affiliate  // affiliate도 전달
          );
        }

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
  }, [items, onCurrentItemChange]);

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
            <li key={`${item.id}-${index}`}>
              {item.affiliate}  {/* affiliate 값 표시 */}
            </li>
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
