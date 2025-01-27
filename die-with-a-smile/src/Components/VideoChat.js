import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidV4 } from "uuid";
import SmileDetection from "./SmileDetection"; // Import SmileDetection

const socket = io("https://die-with-a-smile-production.up.railway.app");

const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const peers = useRef({});
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
            console.log("User connected:", userId);
            const peer = createPeer(userId, socket.id, stream);
            peers.current[userId] = peer;
          });

          socket.on("offer", (offer, senderId) => {
            console.log("Received offer from:", senderId);
            const peer = addPeer(offer, senderId, stream);
            peers.current[senderId] = peer;
          });

          socket.on("answer", (answer, senderId) => {
            console.log("Received answer from:", senderId);
            if (peers.current[senderId]) {
              peers.current[senderId].signal(answer);
            }
          });

          socket.on("ice-candidate", (candidate, senderId) => {
            console.log("Received ICE candidate from:", senderId);
            if (peers.current[senderId]) {
              peers.current[senderId].signal(candidate);
            }
          });

          socket.on("user-disconnected", (userId) => {
            console.log("User disconnected:", userId);
            if (peers.current[userId]) {
              peers.current[userId].destroy();
              delete peers.current[userId];
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
      config: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    });

    peer.on("signal", (signal) => {
      socket.emit("offer", signal, userToSignal);
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
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

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peer.signal(incomingSignal);
    return peer;
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
          <video ref={userVideo} autoPlay playsInline />
          <SmileDetection videoRef={myVideo} user="Your" />
          <SmileDetection videoRef={userVideo} user="Other User" />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
