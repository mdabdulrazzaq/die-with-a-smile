import React, { useEffect, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as drawing from "@mediapipe/drawing_utils";

const SmileDetection = ({ videoRef, user }) => {
  const [smileScore, setSmileScore] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Calculate smile intensity based on mouth landmarks
        const leftMouthCorner = landmarks[61]; // Left corner of the mouth
        const rightMouthCorner = landmarks[291]; // Right corner of the mouth
        const upperLip = landmarks[13]; // Upper lip center
        const lowerLip = landmarks[14]; // Lower lip center

        const horizontalDistance = Math.sqrt(
          Math.pow(rightMouthCorner.x - leftMouthCorner.x, 2) +
            Math.pow(rightMouthCorner.y - leftMouthCorner.y, 2)
        );

        const verticalDistance = Math.sqrt(
          Math.pow(lowerLip.x - upperLip.x, 2) +
            Math.pow(lowerLip.y - upperLip.y, 2)
        );

        const smileIntensity = (horizontalDistance / verticalDistance).toFixed(2);
        setSmileScore(smileIntensity * 100); // Normalize score
      }
    });

    const videoElement = videoRef.current;
    const startDetection = async () => {
      if (!videoElement) return;

      const sendVideoToFaceMesh = async () => {
        await faceMesh.send({ image: videoElement });
        requestAnimationFrame(sendVideoToFaceMesh);
      };

      sendVideoToFaceMesh();
    };

    startDetection();

    return () => {
      faceMesh.close();
    };
  }, [videoRef]);

  return (
    <div>
      <h3>{user}'s Smile Score: {smileScore.toFixed(0)}</h3>
    </div>
  );
};

export default SmileDetection;
