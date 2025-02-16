"use client"

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { RightArrow, LeftArrow } from "../components/Icons";
import "./Scroll.css";

// ✅ 인디케이터 컴포넌트
import Indicator from "../test/Indicator";

// 파이어베이스 임포트
import { db } from "../src/firebase-config"; // 🔹 db import 추가!
import { collection, getDocs } from "firebase/firestore";

function SlideItem({ item, index, scrollX, containerWidth, itemSpacing, maxScale, minScale, totalItems }) {
  // baseOffset: 중간 세트의 시작 위치 (원본 아이템 수 * 슬라이드 간격)
  const baseOffset = totalItems * itemSpacing;
  // modIndex: 복제 배열 내에서 실제 원본 인덱스
  const modIndex = index % totalItems;
  // 실제 슬라이드의 중앙 좌표: 중간 세트의 시작 오프셋 + 해당 아이템의 중앙
  const itemCenter = baseOffset + modIndex * itemSpacing + itemSpacing / 2;
  
  const scale = useTransform(scrollX, (scrollXVal) => {
    const containerCenter = scrollXVal + containerWidth / 2;
    const distance = Math.abs(itemCenter - containerCenter);
    const maxDistance = containerWidth / 2; // 최대 거리: 컨테이너 반
    const ratio = Math.min(distance / maxDistance, 1);
    return maxScale - (maxScale - minScale) * ratio;
  });

  return (
    <motion.li
      style={{
        scale,
        flex: "0 0 200px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img src={item.imageUrl} alt="Profile Image" />
    </motion.li>
  );
}


export default function ScrollLinked({ onCurrentItemChange }) {
  const ref = useRef(null);
  const { scrollX, scrollXProgress } = useScroll({ container: ref });
  const maskImage = useScrollOverflowMask(scrollXProgress);

  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Firestore에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "voteResults"));
      const fetchedItems = querySnapshot.docs.map(doc => ({
        id: doc.id,
        affiliate: doc.data().affiliate,
        imageUrl: doc.data().imageUrl || "/default_profile.webp",
        ...doc.data()
      }));
      setItems(fetchedItems);
    };
    fetchData();
  }, []);

  const duplicatedItems = [...items, ...items, ...items];


  // "중간 세트"로 초기 스크롤 위치 설정
  useEffect(() => {
    const ul = ref.current;
    if (!ul || items.length === 0) return;
    const itemWidth = ul.scrollWidth / duplicatedItems.length;
    const oneSetWidth = itemWidth * items.length;
    ul.scrollLeft = oneSetWidth;
  }, [items]);

  // 스크롤 이벤트로 현재 인덱스 계산 (원본 배열 기준)
  useEffect(() => {
    const ul = ref.current;
    if (!ul || items.length === 0) return;

    let timeoutId = null;
    const tolerance = 10;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const { scrollLeft, scrollWidth, clientWidth } = ul;
        const itemWidth = scrollWidth / duplicatedItems.length;
        const oneSetWidth = itemWidth * items.length;

        // 양끝 처리: 무한 스크롤 복제 영역 보정
        if (scrollLeft < oneSetWidth - tolerance) {
          ul.style.scrollBehavior = "auto";
          ul.scrollLeft += oneSetWidth;
        } else if (scrollLeft > oneSetWidth * 2 + tolerance) {
          ul.style.scrollBehavior = "auto";
          ul.scrollLeft -= oneSetWidth;
        }

        // 컨테이너 중앙 좌표
        const containerCenter = ul.scrollLeft + clientWidth / 2;
        // 원본 아이템 기준 인덱스: (rawIndex % items.length)
        const rawIndex = Math.floor(containerCenter / itemWidth);
        let modIndex = rawIndex % items.length;
        if (modIndex < 0) modIndex += items.length;
        setCurrentIndex(modIndex);

        // 부모에 현재 아이템 전달
        if (onCurrentItemChange && items[modIndex]) {
          onCurrentItemChange(items[modIndex].id, items[modIndex].affiliate);
        }

        ul.style.scrollSnapType = "x mandatory";
        ul.style.scrollBehavior = "smooth";
      }, 150);
    };

    ul.addEventListener("scroll", handleScroll);
    return () => {
      ul.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [items, onCurrentItemChange, duplicatedItems]);

  // 인디케이터 dot 클릭 시 원본 배열 기준 스크롤 이동
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

  // 다음/이전 버튼 (기존 로직 유지)
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

  // 슬라이더 컨테이너 폭 (CSS 상 max-width: 375px)
  const containerWidth = 375;
  // 각 슬라이드의 전체 공간: li width (200px) + gap (20px)
  const itemSpacing = 220;
  // 확대 효과 값
  const maxScale = 1.4;
  const minScale = 1.0;

  return (
    <div className="scroll-linked-root">
      <Indicator
        total={items.length}
        currentIndex={currentIndex}
        onDotClick={onDotClick}
      />

      <div className="scroll-container">
        <div className="scroll-arrow left" onClick={scrollToPrev}>
          <LeftArrow />
        </div>

        <motion.ul ref={ref} className="scroll-list" style={{ maskImage }}>
          {duplicatedItems.map((item, index) => (
            <SlideItem
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              scrollX={scrollX}
              containerWidth={containerWidth}
              itemSpacing={itemSpacing}
              maxScale={maxScale}
              minScale={minScale}
              totalItems={items.length}
            />
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
