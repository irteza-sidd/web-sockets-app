import express from "express";
import http from "http";
import "./crons/cronJob.js";
import { initializeSocket } from "./socket-config/socket.js";

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.get("/", (req, res) => {
  res.send("Socket.IO server is running");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
