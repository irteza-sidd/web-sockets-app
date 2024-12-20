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
      await handleConfigUpdate(
        io,
        socket,
        data,
        "selected_color",
        "color_updated"
      );
    });

    socket.on("update_text_direction", async (data) => {
      await handleConfigUpdate(
        io,
        socket,
        data,
        "direction",
        "text_direction_updated"
      );
    });

    socket.on("update_speed", async (data) => {
      await handleConfigUpdate(io, socket, data, "speed", "speed_updated");
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const handleConfigUpdate = async (io, socket, data, field, emitEvent) => {
  const { customer_id, value } = data;

  try {
    await updateUserConfigInDB(customer_id, { [field]: value });

    const updatePayload = { customer_id, value };
    io.emit(emitEvent, updatePayload);
    console.log(`${field} updated for user ${customer_id}: ${value}`);
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    socket.emit("error", { message: `Failed to update ${field}` });
  }
};
