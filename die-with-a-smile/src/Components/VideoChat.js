import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidV4 } from "uuid";

const socket = io("https://die-with-a-smile-production.up.railway.app");

const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    if (joined) {
      socket.emit("join-room", roomId, socket.id);

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myVideo.current.srcObject = stream;

          // 🔹 User Joins: Start a WebRTC connection
          socket.on("user-connected", (userId) => {
            console.log("User connected:", userId);
            startPeerConnection(true, stream);
          });

          // 🔹 Handle Incoming Offer: Create Answer
          socket.on("offer", (offer) => {
            console.log("Received offer:", offer);
            startPeerConnection(false, stream, offer);
          });

          // 🔹 Handle Answer (for Initiator)
          socket.on("answer", (answer) => {
            console.log("Received answer:", answer);
            peerRef.current.signal(answer);
          });

          // 🔹 Handle ICE Candidates
          socket.on("ice-candidate", (candidate) => {
            console.log("Received ICE candidate:", candidate);
            peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          });

          // 🔹 Handle Disconnection
          socket.on("user-disconnected", () => {
            if (peerRef.current) {
              peerRef.current.destroy();
            }
          });
        })
        .catch(error => console.error("Error accessing media devices:", error));
    }
  }, [joined, roomId]);

  // 🔹 Function to Create WebRTC Connection
  const startPeerConnection = (initiator, stream, offer = null) => {
    const peer = new Peer({
      initiator: initiator, // true for first user, false for second
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      if (initiator) {
        socket.emit("offer", data, roomId); // Send Offer if Initiator
      } else {
        socket.emit("answer", data, roomId); // Send Answer if Not Initiator
      }
    });

    peer.on("stream", (userStream) => {
      console.log("Received remote stream");
      userVideo.current.srcObject = userStream;
    });

    peer.on("ice-candidate", (candidate) => {
      socket.emit("ice-candidate", candidate, roomId);
    });

    if (offer) {
      peer.signal(offer); // If not initiator, respond to offer
    }

    peerRef.current = peer;
  };

  // 🔹 Create Room Function
  const createRoom = () => {
    const newRoomId = uuidV4();
    setRoomId(newRoomId);
    setJoined(true);
  };

  // 🔹 Join Room Function
  const joinRoom = () => {
    setJoined(true);
    socket.emit("join-room", roomId, socket.id);
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
          <video ref={myVideo} autoPlay muted />
          <video ref={userVideo} autoPlay />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
