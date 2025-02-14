import { storage } from "../src/firebase-config"; // ✅ Firebase Storage 가져오기
import { useEffect, useState } from "react";
import { ref, getDownloadURL } from "firebase/storage"; // ✅ 필요한 모듈만 가져오기

function HorseImage({ imagePath }) {
  const [imageURL, setImageURL] = useState(localStorage.getItem(imagePath));

  useEffect(() => {
    if (!imageURL) {
      const fetchImage = async () => {
        try {
          const imageRef = ref(storage, "horse.png");
          const url = await getDownloadURL(imageRef);

          setImageURL(url);
          localStorage.setItem(imagePath, url); // ✅ 로컬 스토리지에 저장
        } catch (error) {
          console.error("이미지를 불러오는 중 오류 발생:", error);
        }
      };

      fetchImage();
    }
  }, [imagePath, imageURL]);

  return (
    <img src={imageURL} alt="Horse" style={{ width: "100px", height: "100px", objectFit: "cover" }} />
  );
}

export default HorseImage;
