import React, { useEffect, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as drawing from "@mediapipe/drawing_utils";

const SmileDetection = ({ videoRef, user }) => {
  const [smileScore, setSmileScore] = useState(0);
  const [stableScore, setStableScore] = useState(0);
  const canvasRef = useRef(null);
  const scoreHistory = useRef([]); // Store recent scores for smoothing

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

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
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Match canvas size with video size
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw face mesh landmarks
      if (results.multiFaceLandmarks) {
        const landmarks = results.multiFaceLandmarks[0];
        drawing.drawConnectors(ctx, landmarks, FaceMesh.FACEMESH_TESSELATION, {
          color: "#00FF00",
          lineWidth: 1,
        });
        drawing.drawLandmarks(ctx, landmarks, { color: "#FF0000", radius: 1 });

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

        // Normalize the score
        const normalizedSmileScore = Math.min(
          Math.max(smileIntensity * 100, 0),
          100
        );

        // Add score to history for smoothing
        scoreHistory.current.push(normalizedSmileScore);
        if (scoreHistory.current.length > 10) {
          scoreHistory.current.shift(); // Keep the last 10 scores
        }

        // Calculate the smoothed score (moving average)
        const smoothedScore =
          scoreHistory.current.reduce((a, b) => a + b, 0) /
          scoreHistory.current.length;

        setSmileScore(normalizedSmileScore);
        setStableScore(smoothedScore);
      } else {
        setSmileScore(0);
        setStableScore(0);
      }
    });

    // Video processing
    const videoElement = videoRef.current;
    const startDetection = async () => {
      const processFrame = async () => {
        if (videoElement.readyState >= 2) {
          await faceMesh.send({ image: videoElement });
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

  const getEmoji = () => {
    if (stableScore > 85) return "😁";
    if (stableScore > 60) return "😊";
    if (stableScore > 40) return "🙂";
    if (stableScore > 20) return "😐";
    return "😢";
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "auto", borderRadius: "10px" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Allow interaction with video
        }}
      />
      <h3 style={{ textAlign: "center", margin: "10px 0" }}>
        {user}'s Smile Score: <span>{stableScore.toFixed(0)}</span> {getEmoji()}
      </h3>
      <div
        style={{
          background: "#e0e0e0",
          borderRadius: "5px",
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
            width: `${stableScore}%`,
            transition: "width 0.3s ease",
          }}
        ></div>
      </div>
    </div>
  );
};

export default SmileDetection;
