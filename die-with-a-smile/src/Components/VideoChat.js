import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { v4 as uuidV4 } from "uuid";

const socket = io("http://localhost:5001");

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
            const peer = new Peer({
              initiator: true,
              trickle: false,
              stream: stream,
            });

            peer.on("signal", (data) => {
              socket.emit("sending-signal", { userId, signal: data });
            });

            peer.on("stream", (userStream) => {
              userVideo.current.srcObject = userStream;
            });

            socket.on("returning-signal", (signal) => {
              peer.signal(signal);
            });

            peerRef.current = peer;
          });
        });

      socket.on("user-disconnected", () => {
        if (peerRef.current) {
          peerRef.current.destroy();
        }
      });
    }
  }, [joined, roomId]);

  const createRoom = () => {
    const newRoomId = uuidV4();
    setRoomId(newRoomId);
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
          <button onClick={() => setJoined(true)}>Join Room</button>
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
