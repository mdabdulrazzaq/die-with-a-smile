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

    // Notify other users in the room
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("offer", (offer, targetId) => {
      console.log("Relaying offer to:", targetId);
      socket.to(targetId).emit("offer", offer, userId);
    });

    socket.on("answer", (answer, targetId) => {
      console.log("Relaying answer to:", targetId);
      socket.to(targetId).emit("answer", answer, userId);
    });

    socket.on("ice-candidate", (candidate, targetId) => {
      console.log("Relaying ICE candidate to:", targetId);
      socket.to(targetId).emit("ice-candidate", candidate, userId);
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from room ${roomId}`);
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});


server.listen(8080, () => {
  console.log("Server running on port 8080");
});
