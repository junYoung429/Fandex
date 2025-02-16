import { useEffect, useState } from "react";
import { db } from "./firebase-config"; // 🔹 db import 추가!
import { doc, setDoc, getDoc } from "firebase/firestore";

import { v4 as uuidv4 } from "uuid"; // UUID 생성 라이브러리
import './App.css';

import { adjectives } from "../utils/nameAdjectives"; // 닉네임 랜덤 형용사 
import CommentInput from '../comments/commentInput';
import CommentScroll from '../comments/commentScroll';
import Vote from '../votes/vote';
import SimpleSlider from '../test/Carousel';

function App() {

  const [userUUID, setUserUUID] = useState(null); // ✅ userUUID를 상태로 관리. CommentInput에 props로 넘겨주기 위해 전역 관리
  const [refresh, setRefresh] = useState(false); // 🔹 댓글이 추가될 때마다 재렌더링 트리거
  const [currentTargetId, setCurrentTargetId] = useState(""); // 현재 선택된 투표 대상 ID

  useEffect(() => {
    const initializeUser = async () => {
      const SERVICE_NAME = "Fandex"; // 서비스 고유 이름
      const USER_KEY = `${SERVICE_NAME}_userUUID`; // "Fandex_userUUID"
      
      let storedUUID = localStorage.getItem(USER_KEY); // 우리 서비스 전용 UUID 가져오기

      // 랜덤 이름 생성 로직
      function generateRandomUserName() {
        const randomIndex = Math.floor(Math.random() * adjectives.length);
        return `${adjectives[randomIndex]} 유령`;
      }
      
      if (!storedUUID) {
        storedUUID = uuidv4(); // 새 UUID 생성
        localStorage.setItem(USER_KEY, storedUUID); // 우리 서비스 전용 UUID 저장
      }

      setUserUUID(storedUUID); // ✅ 상태 업데이트
      
      // Firestore에 해당 UUID의 유저가 존재하는지 확인
      const userDocRef = doc(db, "users", storedUUID);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Firestore에 유저 데이터 추가
        const newUser = {
          uid: storedUUID,
          displayName: generateRandomUserName(),
          // 기본 프로필 이미지 URL을 profileImage 필드에 저장
          profileImage: "/default_profile.webp",
          createAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newUser);
        console.log("새로운 유저가 Firestore에 추가되었습니다:", newUser);
        // localStorage에 저장
        localStorage.setItem("Fandex_userName", newUser.displayName);
      } else {
        const userData = userDocSnap.data();
        console.log("이미 등록된 유저입니다:", userData);
        // localStorage에 업데이트
        localStorage.setItem("Fandex_userName", userData.displayName);
      }
    };

    initializeUser();
  }, []);

  return(
    <>
    <div className="container">
      {/* <Vote 
        currentTargetId={currentTargetId} 
        setCurrentTargetId={setCurrentTargetId}
      /> */}

      <div style={{ height: "100px" }}></div>
      <SimpleSlider />

      <CommentInput 
        userUUID={userUUID} 
        refresh={refresh} 
        setRefresh={setRefresh}
        currentTargetId={currentTargetId}
      />
      <CommentScroll 
        userUUID={userUUID} 
        refresh={refresh} 
        setRefresh={setRefresh}
        currentTargetId={currentTargetId}
      />
    </div>
    </>
  );
}

export default App
