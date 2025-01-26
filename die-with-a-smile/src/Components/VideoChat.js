import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidV4 } from "uuid";

const socket = io("https://die-with-a-smile-production.up.railway.app");
const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [peers, setPeers] = useState([]);
  const myVideo = useRef();
  const userVideos = useRef({}); // Store videos for each user
  const streamRef = useRef();

  useEffect(() => {
    if (joined) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myVideo.current.srcObject = stream;
          streamRef.current = stream;

          socket.emit("join-room", roomId, socket.id);

          socket.on("user-connected", (userId) => {
            const peer = createPeer(userId, socket.id, stream);
            setPeers((prev) => [...prev, { peer, userId }]);
          });

          socket.on("offer", (offer, senderId) => {
            const peer = addPeer(offer, senderId, stream);
            setPeers((prev) => [...prev, { peer, userId: senderId }]);
          });

          socket.on("answer", (answer, senderId) => {
            const peerObj = peers.find((p) => p.userId === senderId);
            if (peerObj) peerObj.peer.signal(answer);
          });

          socket.on("ice-candidate", (candidate, senderId) => {
            const peerObj = peers.find((p) => p.userId === senderId);
            if (peerObj) peerObj.peer.signal(candidate);
          });

          socket.on("user-disconnected", (userId) => {
            const peerObj = peers.find((p) => p.userId === userId);
            if (peerObj) {
              peerObj.peer.destroy();
              setPeers((prev) => prev.filter((p) => p.userId !== userId));
            }
          });
        })
        .catch((error) => console.error("Error accessing media devices:", error));
    }
  }, [joined, roomId]);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("offer", signal, userToSignal);
    });

    peer.on("stream", (userStream) => {
      addVideoStream(userStream, userToSignal);
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("answer", signal, callerId);
    });

    peer.on("stream", (userStream) => {
      addVideoStream(userStream, callerId);
    });

    peer.signal(incomingSignal);
    return peer;
  };

  const addVideoStream = (stream, userId) => {
    if (!userVideos.current[userId]) {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      userVideos.current[userId] = video;
      document.body.appendChild(video); // Replace with better DOM handling
    }
  };

  const createRoom = () => {
    const newRoomId = uuidV4();
    setRoomId(newRoomId);
    setJoined(true);
  };

  const joinRoom = () => {
    setJoined(true);
  };

  return (
    <div>
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
          <button onClick={createRoom}>Create Room</button>
        </div>
      ) : (
        <div>
          <h2>Room ID: {roomId}</h2>
          <video ref={myVideo} autoPlay playsInline muted />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
