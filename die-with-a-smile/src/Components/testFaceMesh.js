import { FaceMesh } from "@mediapipe/face_mesh";

const testFaceMesh = () => {
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
    console.log("FaceMesh results:", results);
  });
};
testFaceMesh();
