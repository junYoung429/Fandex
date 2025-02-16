import Modal from "react-modal";
import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { storage, db } from "../src/firebase-config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./popup.css";
import { CloseIcon, EditIcon } from "./Icons";

// 화면 전체를 덮고, 텍스트를 중앙에 배치하기 위한 스타일
const customModalStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9999,
  },
  content: {
    // content 영역을 투명 & 전체 화면으로 설정
    backgroundColor: "transparent",
    border: "none",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    margin: 0,
    // Flex로 가운데 정렬
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

function InfoModal({ isOpen, onRequestClose, message }) {
  // 전체 content 클릭 시 모달 닫기
  const handleClick = () => {
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customModalStyles}
      ariaHideApp={false}
      contentLabel="Info Modal"
      shouldCloseOnOverlayClick={false} // overlay 클릭은 content에 포함되어 있으므로 false
    >
      {/* content 전체에 onClick 설정 */}
      <div
        style={{
          width: "100%",
          height: "100%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={handleClick}
      >
        {/* 내부 텍스트 영역에 좌우 padding 적용 */}
        <div
          style={{
            boxSizing: "border-box",
            width: "100%",
            padding: "0 35px", // 좌우 18px padding -> 전체 36px 여백 효과
            color: "white",
            fontFamily: "SUITE Variable",
            textAlign: "center",
            fontSize: "18px",
            fontStyle: "normal",
            fontWeight: "700",
            lineHeight: "24px",
          }}
        >
          {message}
        </div>
      </div>
    </Modal>
  );
}


function ProfileModal({ isOpen, onRequestClose, userUUID }) {
  const [profileImage, setProfileImage] = useState("/default_profile.webp");
  const [displayName, setDisplayName] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userUUID) return;
      try {
        const userDocRef = doc(db, "users", userUUID);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.profileImage) {
            setProfileImage(data.profileImage);
          }
          if (data.displayName) {
            setDisplayName(data.displayName);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };
    fetchProfileData();
  }, [userUUID]);

  // 이미지 클릭 -> 파일 선택창
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 파일 선택 -> Storage 업로드
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `profileImages/${userUUID}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, "users", userUUID);
      await setDoc(userDocRef, { profileImage: downloadURL }, { merge: true });

      setProfileImage(downloadURL);
      console.log("프로필 이미지 업데이트 완료:", downloadURL);
    } catch (error) {
      console.error("프로필 이미지 업로드 중 오류 발생:", error);
    }
  };

  // 닉네임 저장 (onBlur, 엔터 등에서 호출)
  const saveDisplayName = async () => {
    if (!displayName) return;
    try {
      const userDocRef = doc(db, "users", userUUID);
      await setDoc(userDocRef, { displayName }, { merge: true });
      console.log("디스플레이 이름 업데이트 완료:", displayName);
    } catch (error) {
      console.error("디스플레이 이름 업데이트 중 오류 발생:", error);
    }
  };

  // 엔터키 -> 저장 후 blur
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur(); // onBlur 이벤트 발생 -> saveDisplayName
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onRequestClose}>
          <CloseIcon />
        </button>
        <div style={{ height: "40px" }}></div>
        <span className="profile-title">마이 프로필</span>
        <div style={{ height: "60px" }}></div>

        {/* 프로필 이미지 */}
        <div className="profile-image">
          <img
            src={profileImage}
            alt="Profile"
            onClick={handleImageClick}
            style={{ cursor: "pointer" }}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div style={{ height: "32px" }}></div>

        {/* 닉네임 인라인 입력 */}
        <div className="user-name" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div 
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderBottom: "1px solid white",
              paddingBottom: "4px",
              gap: "8px",
              width: "200px",
              justifyContent: "center",
            }}
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={saveDisplayName}
              onKeyDown={handleKeyDown}
              style={{
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                color: "white",
                fontFamily: "SUITE Variable",
                fontSize: "20px",
                fontWeight: "700",
                paddingBottom: "2px",
                textAlign: "center",
                width: "100%",
              }}
            />
            <div style={{ cursor: "pointer" }}>
              <EditIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export { InfoModal, ProfileModal };
