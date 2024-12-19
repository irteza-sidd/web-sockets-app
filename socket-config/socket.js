import { Server } from "socket.io";
import { updateUserConfigInDB } from "../handlers/configHandler.js";
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.emit("welcome", { message: "Welcome to the Socket.IO server!" });

    socket.on("update_color", async (data) => {
      await handleConfigUpdate(socket, data, "selected_color");
    });

    socket.on("update_direction", async (data) => {
      await handleConfigUpdate(socket, data, "direction");
    });

    socket.on("update_speed", async (data) => {
      await handleConfigUpdate(socket, data, "speed");
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const handleConfigUpdate = async (socket, data, field) => {
  const { userId, value } = data;
  try {
    socket.broadcast.emit(`${field}_updated`, { userId, value });
    console.log(`${field} updated for user ${userId}: ${value}`);

    await updateUserConfigInDB(userId, { [field]: value });

    console.log(`Database updated for ${field} of user ${userId}: ${value}`);
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    socket.emit("error", { message: `Failed to update ${field}` });
  }
};
