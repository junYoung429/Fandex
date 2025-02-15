import "./vote.css"; // CSS 파일 임포트
import { InfoIcon, MyProfileIcon } from "../components/Icons";
import { useEffect } from "react";
import { useState } from "react";
import InfoModal from "../components/popup";
import ScrollLinked from '../components/Scroll';  // 상단에 import 추가


function Vote(){
    // 🔥 여기서 modalOpen, setModalOpen을 선언
    const [modalOpen, setModalOpen] = useState(false);

    return(
        <div>
            <div className="row-top">
                <div className="left">
                    <span className="left-text">투표</span>
                    <div onClick={() => setModalOpen(true)} style={{ display: "inline-block", cursor: "pointer" }}>
                        <InfoIcon/>
                    </div>
                </div>
                <MyProfileIcon/>
            </div>

            {/* InfoModal 렌더링 */}
            <InfoModal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                message={
                    <>
                    FANDEX는
                    <br />
                    자체 개발한 투표 집계 시스템을 통해
                    <br />
                    항상 최신의 지지율을 반영해요.
                    </>
                }
            />

            <ScrollLinked />

            <div className="full-width affiliate-container">
                <span>부산대학교 총장</span>
            </div>
            <div className="full-width name-container">
                <span>최재원</span>
            </div>

            <div className="row-bottom">
                <div className="voteButton voteButton-like">
                    <span>응원해요</span>
                </div>
                <div className="voteButton voteButton-dislike">
                    <span>아쉬워요</span>
                </div>
            </div>

        </div>
    )
}

const Alert = () => {
    const [alerts, setAlerts] = useState([
        { id: 1, user: "유저1", person: "인물A" },
        { id: 2, user: "유저2", person: "인물B" },
        { id: 3, user: "유저3", person: "인물C" },
    ]);

    useEffect(()=>{
        setTimeout(()=>{}, 2000)
    })


    return (
        <div className="alert-container">
            {
            alerts.length > 0 
            ? (<div className="alert-row">
                {alerts.map((alert) => (
                    <span key={alert.id} className="alert-item">
                        🔥 <span className="alert-highlight">"{alert.user}"</span>님이 "<span className="alert-highlight">"{alert.person}"</span>"님을 응원해요
                    </span>
                    ))}
                </div>)
            : (
                <div className="alert-placeholder"></div> // 공간 유지용
            )}
        </div>
    );
};


export default Vote;