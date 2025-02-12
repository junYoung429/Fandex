import { useState } from 'react'
import { useEffect } from 'react';
import { db } from "./firebase-config"; // 🔹 db import 추가!
import { getFirestore, collection, addDoc } from "firebase/firestore";
import './App.css'
import CommentInput from '../comments/commentInput'
import CommentScroll from '../comments/commentScroll';
import Vote from '../votes/vote';

function App() {
  useEffect(() => {
    const addTestData = async () => {
      try {
        // ✅ Firestore의 "user" 컬렉션에 대한 참조 생성
        const usersCollectionRef = collection(db, "user"); // 🔹 이 줄 추가

        // ✅ 테스트 데이터 추가
        const newUser = {
          name: '홍길동',
          email: 'honggildong@example.com',
          age: 30
        };

        // ✅ Firestore에 문서 추가
        const docRef = await addDoc(usersCollectionRef, newUser);
        console.log('새로운 문서가 추가되었습니다. 문서 ID:', docRef.id);      
      } catch (error) {
        console.error("오류 발생:", error);
      }
    };

    addTestData();
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
