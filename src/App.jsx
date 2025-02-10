import { useState } from 'react'
import './App.css'
import Comments from '../comments/comments'

function App() {
  return(
    <>
      <div style={styles.container}>
        <div style={styles.box}>
          <p style={{ color: "white" }}>📦 반응형 박스</p> <Comments/>
        </div>
      </div>
    
    </>
  );
}

const styles = {
  container: {
    backgroundColor: "#101021", //fandex-black 이후 Redux로
    width: "100vw", // 화면 너비 100%
    height: "100vh", // 화면 높이 100%
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    display: "flex",
    width: "375px",
    height: "100%", // 부모 크기 따라감
    minHeight: "100vh", // 최소 높이 설정
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)", // 박스 배경 (살짝 투명)
    borderRadius: "10px",
  },
};



export default App
