import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidV4 } from "uuid";
import process from "process";
window.process = process;


const socket = io("https://die-with-a-smile-production.up.railway.app");

const VideoChat = () => {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    if (userVideo.current && userVideo.current.srcObject === null) {
      console.log("Reconnecting video stream...");
      userVideo.current.srcObject = peerRef.current.streams[0];
    }
  }, [peerRef.current]);
  useEffect(() => {
    console.log("hi");
    if (joined) {
      socket.emit("join-room", roomId, socket.id);

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          myVideo.current.srcObject = stream;

          // 🔹 Assign Initiator Role
          socket.on("assign-initiator", (isInitiator) => {
            if (isInitiator) {
              console.log("I am the initiator");
              startPeerConnection(true, stream);
            }
          });

          // 🔹 User Joins: Start a WebRTC connection
          socket.on("user-connected", (userId) => {
            console.log("User connected:", userId);
            startPeerConnection(true, myVideo.current.srcObject); // Ensure we send our video stream
          });

          // 🔹 Handle Incoming Offer: Create Answer

          socket.on("offer", (offer) => {
            console.log("Received offer:", offer);

            const peer = new Peer({
              initiator: false,  // This user is responding, not initiating
              trickle: false,
              stream: myVideo.current.srcObject, // Attach the local stream
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
              socket.emit("offer", data, roomId);
          });
          
          socket.on("offer", (offer) => {
              console.log("Received WebRTC Offer:", offer);
              peer.signal(offer);
          });
          
          socket.on("answer", (answer) => {
              console.log("Received WebRTC Answer:", answer);
              peer.signal(answer);
          });
          
            peer.on("connect", () => {
              console.log("Peer-to-peer connection established");
            });

            peer.on("signal", (data) => {
              socket.emit("answer", data, roomId);  // Send the answer back
            });

            peer.on("stream", (userStream) => {
              console.log("Receiving remote stream:", userStream);

              if (userVideo.current) {
                userVideo.current.srcObject = userStream;
                userVideo.current
                  .play()
                  .catch((error) => console.log("Video play error: ", error));
              } else {
                console.error("userVideo ref is not available");
              }
              peer.signal(offer); // Accept the received offer
              peerRef.current = peer;
            });
            peer.on("iceStateChange", (state) => {
              console.log("ICE Connection State:", state);
          });
          
          peer.on("iceCandidate", (candidate) => {
              console.log("ICE Candidate received:", candidate);
          });
            peer.on("icecandidate", (event) => {
              console.log("ohooo")
              if (event.candidate) {
                socket.emit("ice-candidate", event.candidate, roomId);
              }
            });

            peer.signal(offer); // Apply the received offer
            peerRef.current = peer;
          });

          // 🔹 Handle Answer (for Initiator)
          socket.on("answer", (answer) => {
            console.log("Received answer:", answer);
            if (peerRef.current) {
              peerRef.current.signal(answer);
            }
          });

          // 🔹 Handle ICE Candidates
          socket.on("ice-candidate", (candidate) => {
            console.log("Received ICE candidate:", candidate);
            if (candidate) {
              peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
            if (peerRef.current) {
              peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error("Error adding ICE candidate:", err));
            } else {
              console.error("Peer reference is missing when receiving ICE candidate.");
            }
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
      console.log("Receiving remote stream:", userStream);
      userVideo.current.srcObject = userStream; // Set remote stream
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
          <video ref={myVideo} autoPlay playsInline muted />
          <video ref={userVideo} autoPlay playsInline />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
