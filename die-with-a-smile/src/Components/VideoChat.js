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

          socket.on("user-connected", (userId) => {
            console.log("User connected:", userId);
            startPeerConnection(true, stream);
          });

          socket.on("offer", (offer) => {
            console.log("Received offer:", offer);
            startPeerConnection(false, stream, offer);
          });

          socket.on("answer", (answer) => {
            console.log("Received answer:", answer);
            if (peerRef.current) {
              peerRef.current.signal(answer);
            }
          });

          socket.on("ice-candidate", (candidate) => {
            console.log("Received ICE candidate:", candidate);
            if (peerRef.current) {
              peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error("Error adding ICE candidate:", err));
            } else {
              console.error("Peer reference is missing when receiving ICE candidate.");
            }
          });

          socket.on("user-disconnected", () => {
            if (peerRef.current) {
              peerRef.current.destroy();
            }
          });
        })
        .catch(error => console.error("Error accessing media devices:", error));
    }
  }, [joined, roomId]);

  const startPeerConnection = (initiator, stream, offer = null) => {
    const peer = new Peer({
      initiator: initiator,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { 
            urls: "turn:relay1.expressturn.com:3478",
            username: "efJBE34Dfd",
            credential: "7sdw9knsd2"
          }
        ]
      }
    });

    peer.on("signal", (data) => {
      console.log("Sending WebRTC Signal:", data);
      if (initiator) {
        socket.emit("offer", data, roomId);
      } else {
        socket.emit("answer", data, roomId);
      }
    });

    peer.on("stream", (userStream) => {
      console.log("Receiving remote stream:", userStream);
      userVideo.current.srcObject = userStream;
    });

    peer.on("ice-candidate", (candidate) => {
      console.log("Sending ICE Candidate:", candidate);
      socket.emit("ice-candidate", candidate, roomId);
    });

    if (offer) {
      peer.signal(offer);
    }

    peerRef.current = peer;
  };

  const createRoom = () => {
    const newRoomId = uuidV4();
    setRoomId(newRoomId);
    setJoined(true);
  };

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
          <video ref={myVideo} autoPlay playsInline muted />
          <video ref={userVideo} autoPlay playsInline />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
