const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 🔹 Handle User Joining a Room
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
  
    const users = io.sockets.adapter.rooms.get(roomId);
    if (users.size === 1) {
      console.log(`User ${userId} is the initiator in room ${roomId}`);
      socket.emit("assign-initiator", true); // First user is the initiator
    }
  
    socket.broadcast.to(roomId).emit("user-connected", userId);
    socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected from room ${roomId}`);
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
      });
  });
//   socket.on("join-room", (roomId, userId) => {
//     socket.join(roomId);
//     console.log(`User ${userId} joined room ${roomId}`);
//     socket.broadcast.to(roomId).emit("user-connected", userId);

//     // Handle User Disconnection
//     socket.on("disconnect", () => {
//       console.log(`User ${userId} disconnected from room ${roomId}`);
//       socket.broadcast.to(roomId).emit("user-disconnected", userId);
//     });
//   });

  // 🔹 Handle WebRTC Offer
  socket.on("offer", (offer, roomId) => {
    console.log("Relaying offer to room:", roomId);
    socket.broadcast.to(roomId).emit("offer", offer);
  });

  // 🔹 Handle WebRTC Answer
  socket.on("answer", (answer, roomId) => {
    console.log("Relaying answer to room:", roomId);
    socket.broadcast.to(roomId).emit("answer", answer);
  });

  // 🔹 Handle ICE Candidates
  socket.on("ice-candidate", (candidate, roomId) => {
    console.log(`Relaying ICE candidate for room: ${roomId}, candidate:`, candidate);
    socket.broadcast.to(roomId).emit("ice-candidate", candidate);
  });  
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});
