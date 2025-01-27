import { FaceMesh } from "@mediapipe/face_mesh";

const TestFaceMesh = () => {
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
export default TestFaceMesh();
