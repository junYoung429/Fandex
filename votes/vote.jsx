import "./vote.css"; // CSS 파일 임포트
import { InfoIcon, MyProfileIcon } from "../components/Icons";
import { useEffect } from "react";
import { useState } from "react";

function Vote(){
    return(
        <div>
            <div className="row">
                <div className="left">
                    <span className="left-text">투표</span>
                    <InfoIcon/>
                </div>
                <MyProfileIcon/>
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