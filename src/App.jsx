import { useEffect } from "react";
import { db } from "./firebase-config"; // 🔹 db import 추가!
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid"; // UUID 생성 라이브러리
import './App.css'

import CommentInput from '../comments/commentInput'
import CommentScroll from '../comments/commentScroll';
import Vote from '../votes/vote';

function App() {
  useEffect(() => {
    const initializeUser = async () => {
      let userUUID = localStorage.getItem("userUUID"); // 로컬스토리지에서 UUID 가져오기

      if (!userUUID) {
        userUUID = uuidv4(); // UUID 생성
        localStorage.setItem("userUUID", userUUID); // 로컬스토리지에 저장
      }

      // Firestore에 해당 UUID의 유저가 존재하는지 확인
      const userDocRef = doc(db, "users", userUUID);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Firestore에 유저 데이터 추가
        const newUser = {
          uid: userUUID,
          displayName: "Guest",
          profileImage: "image",
          createAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newUser);
        console.log("새로운 유저가 Firestore에 추가되었습니다:", newUser);
      } else {
        console.log("이미 등록된 유저입니다:", userDocSnap.data());
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
