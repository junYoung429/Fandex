import { useState } from 'react'
import './App.css'
import CommentInput from '../comments/commentInput'
import CommentScroll from '../comments/commentScroll';

function App() {
  return(
    <>
    <div className="container">
      <div style={{ marginBottom: '100px', height: '100px', backgroundColor: 'transparent' }}></div>
      <CommentInput />
      <CommentScroll />
    </div>

    </>
  );
}




export default App
