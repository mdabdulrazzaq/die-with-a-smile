import React from "react";
import VideoChat from "./Components/VideoChat";
import process from 'process';

window.process = process;

const App = () => {
  window.process = {
    env: {
        NODE_ENV: "development"
    }
};
  return (
    <div>
      <h1>Die with a Smile - Video Game</h1>
      <VideoChat />
    </div>
  );
};

export default App;
