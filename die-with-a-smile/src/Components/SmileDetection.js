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
      minDetectionConfidence: 0.7, // Increased for more stable detection
      minTrackingConfidence: 0.7, // Increased for more stable tracking
    });

    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Extract key landmarks for smile detection
        const leftMouthCorner = landmarks[61];
        const rightMouthCorner = landmarks[291];
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];

        // Calculate distances
        const horizontalDistance = Math.sqrt(
          Math.pow(rightMouthCorner.x - leftMouthCorner.x, 2) +
            Math.pow(rightMouthCorner.y - leftMouthCorner.y, 2)
        );

        const verticalDistance = Math.sqrt(
          Math.pow(lowerLip.x - upperLip.x, 2) +
            Math.pow(lowerLip.y - upperLip.y, 2)
        );

        // Calculate smile intensity
        const smileIntensity = horizontalDistance / verticalDistance;

        // Normalize and set smile score
        const normalizedSmileScore = Math.min(smileIntensity * 100, 100); // Cap at 100
        setSmileScore(normalizedSmileScore);
      } else {
        setSmileScore(0); // Reset smile score if no face detected
      }
    });

    // Video streaming and processing
    const videoElement = videoRef.current;
    if (videoElement) {
      const startDetection = async () => {
        const processFrame = async () => {
          await faceMesh.send({ image: videoElement });
          requestAnimationFrame(processFrame);
        };
        processFrame();
      };

      startDetection();
    }

    return () => {
      faceMesh.close(); // Clean up resources when component unmounts
    };
  }, [videoRef]);

  return (
    <div>
      <h3>{user}'s Smile Score: {smileScore.toFixed(0)}</h3>
    </div>
  );
};

export default SmileDetection;
