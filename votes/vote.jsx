import "./vote.css"; // CSS 파일 임포트
import { InfoIcon, MyProfileIcon } from "../components/Icons";
import { useEffect, useState } from "react";
import InfoModal from "../components/popup";
import ScrollLinked from '../components/Scroll';  // 상단에 import 추가
import { db } from "../src/firebase-config";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import CenterMode from "../test/CenterScroll";

function Vote({ currentTargetId, setCurrentTargetId }){
    const [modalOpen, setModalOpen] = useState(false);
    const [currentAffiliate, setCurrentAffiliate] = useState("");

    useEffect(() => {
        const fetchAffiliate = async () => {
            if (!currentTargetId) return;

            try {
                const docRef = doc(db, "voteResults", currentTargetId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCurrentAffiliate(data.affiliate || ""); // affiliate 필드 값 설정
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching affiliate:", error);
            }
        };

        fetchAffiliate();
    }, [currentTargetId]);

    const handleVote = async (voteType) => {
        try {
            // 로컬스토리지에서 UUID 가져오기
            const userUUID = localStorage.getItem("Fandex_userUUID");
            if (!userUUID) {
                console.error("사용자 UUID를 찾을 수 없습니다.");
                return;
            }

            // votes 컬렉션에 문서 추가
            const votesRef = collection(db, "votes");
            await addDoc(votesRef, {
                authorUUID: userUUID,
                type: voteType,  // "응원해요" 또는 "아쉬워요"
                voteDate: serverTimestamp(),
                targetId: currentTargetId
            });

            console.log("투표가 성공적으로 저장되었습니다!");
            // 여기에 성공 메시지나 UI 업데이트 로직 추가 가능

        } catch (error) {
            console.error("투표 저장 중 오류 발생:", error);
            // 여기에 에러 처리 로직 추가 가능
        }
    };

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

            <CenterMode
                currentTargetId={currentTargetId}
                setCurrentTargetId={setCurrentTargetId}
            />

            <div className="full-width affiliate-container">
                <span>{currentAffiliate}</span>
            </div>
            <div className="full-width name-container">
                <span>{currentTargetId}</span>
            </div>

            <div className="row-bottom">
                <div 
                    className="voteButton voteButton-like"
                    onClick={() => handleVote("응원해요")}
                >
                    <span>응원해요</span>
                </div>
                <div 
                    className="voteButton voteButton-dislike"
                    onClick={() => handleVote("아쉬워요")}
                >
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