import { useEffect } from "react";
import { db } from "./firebase-config"; // 🔹 db import 추가!
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid"; // UUID 생성 라이브러리
import './App.css';

import { adjectives } from "../utils/nameAdjectives"; // 닉네임 랜덤 형용사 
import CommentInput from '../comments/commentInput';
import CommentScroll from '../comments/commentScroll';
import Vote from '../votes/vote';

function App() {
  useEffect(() => {
    const initializeUser = async () => {
      const SERVICE_NAME = "Fandex"; // 서비스 고유 이름
      const USER_KEY = `${SERVICE_NAME}_userUUID`; // "Fandex_userUUID"
      
      let userUUID = localStorage.getItem(USER_KEY); // 우리 서비스 전용 UUID 가져오기

      // 랜덤 이름 생성 로직
      function generateRandomUserName() {
        const randomIndex = Math.floor(Math.random() * adjectives.length);
        return `${adjectives[randomIndex]} 유령`;
      }
      
      if (!userUUID) {
        userUUID = uuidv4(); // 새 UUID 생성
        localStorage.setItem(USER_KEY, userUUID); // 우리 서비스 전용 UUID 저장
      }
      
      // Firestore에 해당 UUID의 유저가 존재하는지 확인
      const userDocRef = doc(db, "users", userUUID);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Firestore에 유저 데이터 추가
        const newUser = {
          uid: userUUID,
          displayName: generateRandomUserName(),
          profileImage: "image",
          createAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newUser);
        console.log("새로운 유저가 Firestore에 추가되었습니다:", newUser);
        console.log("유저 이름:", userDocSnap.data().displayName); // 생성된 유저 이름 확인
      } else {
        console.log("이미 등록된 유저입니다:", userDocSnap.data());
        console.log("유저 이름:", userDocSnap.data().displayName); // 생성된 유저 이름 확인
      }
    };

    initializeUser();
  }, []);

  return(
    <>
    <div className="container">
      <div style={{ marginBottom: '100px', height: '100px', backgroundColor: 'transparent' }}></div>
      <Vote/>

      <CommentInput />
      <CommentScroll />
    </div>

    </>
  );
}




export default App
