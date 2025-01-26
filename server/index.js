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

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Notify others in the room
    socket.broadcast.to(roomId).emit("user-connected", userId);

    // Relay offer, answer, and ICE candidates
    socket.on("offer", (offer, targetId) => {
      console.log("Relaying offer to:", targetId);
      socket.to(targetId).emit("offer", offer, socket.id);
    });

    socket.on("answer", (answer, targetId) => {
      console.log("Relaying answer to:", targetId);
      socket.to(targetId).emit("answer", answer, socket.id);
    });

    socket.on("ice-candidate", (candidate, targetId) => {
      console.log("Relaying ICE candidate to:", targetId);
      socket.to(targetId).emit("ice-candidate", candidate, socket.id);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from room ${roomId}`);
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(8080, () => {
  console.log("Signaling server running on port 8080");
});
