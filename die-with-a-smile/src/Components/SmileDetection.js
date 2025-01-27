import React, { useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";

const SmileDetection = ({ videoRef, user }) => {
  const [smileScore, setSmileScore] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    // Initialize FaceMesh
    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Extract key landmarks for smile detection
        const leftMouthCorner = landmarks[61];
        const rightMouthCorner = landmarks[291];
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        const leftEye = landmarks[159];
        const rightEye = landmarks[386];

        // Calculate distances
        const horizontalDistance = Math.sqrt(
          Math.pow(rightMouthCorner.x - leftMouthCorner.x, 2) +
            Math.pow(rightMouthCorner.y - leftMouthCorner.y, 2)
        );

        const verticalDistance = Math.sqrt(
          Math.pow(lowerLip.x - upperLip.x, 2) +
            Math.pow(lowerLip.y - upperLip.y, 2)
        );

        const eyeDistance = Math.sqrt(
          Math.pow(rightEye.x - leftEye.x, 2) +
            Math.pow(rightEye.y - leftEye.y, 2)
        );

        // Calculate smile intensity
        const smileIntensity =
          (horizontalDistance / verticalDistance) * 2 - eyeDistance * 0.5;

        // Normalize and set smile score
        const normalizedSmileScore = Math.min(Math.max(smileIntensity * 100, 0), 100);
        setSmileScore(normalizedSmileScore);
      } else {
        setSmileScore(0);
      }
    });

    // Video processing
    const startDetection = async () => {
      const canvas = document.createElement("canvas");
      const videoElement = videoRef.current;

      const processFrame = async () => {
        if (videoElement.readyState >= 2) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;

          const context = canvas.getContext("2d");
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          await faceMesh.send({ image: canvas });
        }
        requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    startDetection();

    return () => {
      faceMesh.close();
    };
  }, [videoRef]);

  // Emoji representation
  const getEmoji = () => {
    if (smileScore > 80) return "😁";
    if (smileScore > 60) return "😊";
    if (smileScore > 40) return "🙂";
    if (smileScore > 20) return "😐";
    return "😢";
  };

  // Smile description
  const getSmileDescription = () => {
    if (smileScore > 80) return "Big Smile";
    if (smileScore > 60) return "Smiling";
    if (smileScore > 40) return "Neutral";
    if (smileScore > 20) return "Frowning";
    return "Sad";
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h3>
        {user}'s Smile Score: <span>{smileScore.toFixed(0)}</span> {getEmoji()}
      </h3>
      <div
        style={{
          background: "#e0e0e0",
          borderRadius: "10px",
          overflow: "hidden",
          margin: "10px auto",
          width: "80%",
          height: "20px",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "#4caf50",
            width: `${smileScore}%`,
            transition: "width 0.3s ease",
          }}
        ></div>
      </div>
      <p style={{ fontSize: "18px", fontWeight: "bold" }}>
        {getSmileDescription()}
      </p>
    </div>
  );
};

export default SmileDetection;
