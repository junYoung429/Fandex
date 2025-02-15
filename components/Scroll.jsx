"use client"

import {
    animate,
    motion,
    MotionValue,
    useMotionValue,
    useMotionValueEvent,
    useScroll,
} from "framer-motion"

import { useRef, useEffect } from "react"
import { RightArrow, LeftArrow } from "../components/Icons"
import './Scroll.css';  // CSS 파일 import

export default function ScrollLinked() {
    const ref = useRef(null)
    const { scrollXProgress } = useScroll({ container: ref })
    const maskImage = useScrollOverflowMask(scrollXProgress)
    
    // 기본 아이템 배열
    const items = [
        { id: 1, color: "#ff0088" },
        { id: 2, color: "#dd00ee" },
        { id: 3, color: "#9911ff" },
        { id: 4, color: "#0d63f8" },
        { id: 5, color: "#0cdcf7" },
        { id: 6, color: "#4ff0b7" }
    ]

    // 무한 스크롤을 위해 앞뒤로 아이템 복제
    const duplicatedItems = [...items, ...items, ...items]  // 3번 반복

    // 초기 스크롤 위치 설정을 위한 useEffect 추가
    useEffect(() => {
        const ul = ref.current;
        if (!ul) return;
        
        // 한 세트의 너비만큼 스크롤하여 중간 세트로 이동
        const itemWidth = ul.scrollWidth / duplicatedItems.length;
        const oneSetWidth = itemWidth * items.length;
        ul.scrollLeft = oneSetWidth;  // 중간 세트의 시작 위치로 스크롤
    }, []);  // 컴포넌트 마운트 시 한 번만 실행

    // 기존의 스크롤 이벤트 useEffect
    useEffect(() => {
        const ul = ref.current;
        if (!ul) return;
      
        let timeoutId = null;
        const tolerance = 10; // 픽셀 단위의 허용 오차 (상황에 따라 조절)
      
        const handleScroll = () => {
          if (timeoutId) clearTimeout(timeoutId);
      
          // 스크롤 멈춤을 감지하여 150ms 후에 처리
          timeoutId = setTimeout(() => {
            const { scrollLeft, scrollWidth } = ul;
            const itemWidth = scrollWidth / duplicatedItems.length;
            const oneSetWidth = itemWidth * items.length;
      
            // 스냅 충돌을 피하기 위해 scroll-snap 임시 비활성화
            ul.style.scrollSnapType = 'none';
      
            if (scrollLeft < oneSetWidth - tolerance) {
              ul.style.scrollBehavior = 'auto';
              ul.scrollLeft += oneSetWidth;
            } else if (scrollLeft > oneSetWidth * 2 + tolerance) {
              ul.style.scrollBehavior = 'auto';
              ul.scrollLeft -= oneSetWidth;
            }
      
            // 조정 후 다시 스냅 활성화 및 스크롤 동작 복원
            ul.style.scrollSnapType = 'x mandatory';
            ul.style.scrollBehavior = 'smooth';
          }, 150);
        };
      
        ul.addEventListener('scroll', handleScroll);
        return () => {
          ul.removeEventListener('scroll', handleScroll);
          if (timeoutId) clearTimeout(timeoutId);
        };
      }, []);
      
    

    const scrollToNext = () => {
        const ul = ref.current;
        if (!ul) return;
        
        // 고정된 한 칸 거리 (아이템 200px + gap 20px)
        const ITEM_WIDTH = 200;
        const GAP = 20;
        const moveDistance = ITEM_WIDTH + GAP;

        // 스크롤 시작 전에 스냅 비활성화
        ul.style.scrollSnapType = 'none';
        
        // 부드러운 스크롤 실행
        ul.scrollBy({ 
            left: moveDistance, 
            behavior: 'smooth' 
        });

        // 스크롤 애니메이션이 끝나면 스냅 다시 활성화
        const enableSnap = () => {
            ul.style.scrollSnapType = 'x mandatory';
        };

        // 스크롤 애니메이션 완료 시점에 맞춰 스냅 복원 (대략 500ms)
        setTimeout(enableSnap, 500);
    };

    const scrollToPrev = () => {
        const ul = ref.current;
        if (!ul) return;
        
        // 고정된 한 칸 거리 (아이템 200px + gap 20px)
        const ITEM_WIDTH = 200;
        const GAP = 20;
        const moveDistance = ITEM_WIDTH + GAP;

        // 스크롤 시작 전에 스냅 비활성화
        ul.style.scrollSnapType = 'none';
        
        // 부드러운 스크롤 실행 (왼쪽으로 이동하므로 음수값)
        ul.scrollBy({ 
            left: -moveDistance, 
            behavior: 'smooth' 
        });

        // 스크롤 애니메이션이 끝나면 스냅 다시 활성화
        const enableSnap = () => {
            ul.style.scrollSnapType = 'x mandatory';
        };

        setTimeout(enableSnap, 500);
    };

    return (
        <div id="example">
            <svg id="progress" width="80" height="80" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" pathLength="1" className="bg" />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="30"
                    className="indicator"
                    style={{ pathLength: scrollXProgress }}
                />
            </svg>
            <div className="scroll-arrow left" onClick={scrollToPrev}>
                <LeftArrow />
            </div>
            <motion.ul ref={ref} style={{ maskImage }}>
                {duplicatedItems.map((item, index) => (
                    <li key={`${item.id}-${index}`} style={{ background: item.color }}></li>
                ))}
            </motion.ul>
            <div className="scroll-arrow right" onClick={scrollToNext}>
                <RightArrow />
            </div>
        </div>
    )
}

const left = `0%`
const right = `100%`
const leftInset = `20%`
const rightInset = `80%`
const transparent = `#0000`
const opaque = `#000`
function useScrollOverflowMask(scrollXProgress) {
    const maskImage = useMotionValue(
        `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
    )

    useMotionValueEvent(scrollXProgress, "change", (value) => {
        if (value === 0) {
            animate(
                maskImage,
                `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
            )
        } else if (value === 1) {
            animate(
                maskImage,
                `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${right}, ${opaque})`
            )
        } else if (
            scrollXProgress.getPrevious() === 0 ||
            scrollXProgress.getPrevious() === 1
        ) {
            animate(
                maskImage,
                `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`
            )
        }
    })

    return maskImage
}

