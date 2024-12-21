import { Server } from "socket.io";
import { updateConfigInDB } from "../handlers/configHandler.js";

const userSockets = new Map();
let io;
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("register_socket", (data) => {
      const { customer_id } = data;
      if (!userSockets.has(customer_id)) {
        userSockets.set(customer_id, new Set());
      }
      userSockets.get(customer_id).add(socket.id);
      console.log(`User ${customer_id} registered with socket ${socket.id}`);
    });

    // Socket for updating color
    socket.on("update_color", async (data) => {
      const { customer_id, value } = data;
      await handleConfigUpdate(
        io,
        socket,
        "customer_layout",
        { customer_id },
        { preview_color: value },
        "color_updated"
      );
    });

    // Socket for updating running text
    socket.on("update_running_text", async (data) => {
      const { customer_id, value } = data;
      await handleConfigUpdate(
        io,
        socket,
        "customer_running_text",
        { customer_id },
        { text: value },
        "running_text_updated"
      );
    });

    // Socket for updating running text speed
    socket.on("update_text_duration", async (data) => {
      const { customer_id, value } = data;
      await handleConfigUpdate(
        io,
        socket,
        "customer_running_text",
        { customer_id },
        { duration: value },
        "text_duration_updated"
      );
    });

    // Socket for updating running text direction
    socket.on("update_text_direction", async (data) => {
      const { customer_id, value } = data;
      await handleConfigUpdate(
        io,
        socket,
        "customer_running_text",
        { customer_id },
        { direction: value },
        "text_direction_updated"
      );
    });

    // Socket for updating layout direction
    socket.on("update_layout_direction", async (data) => {
      const { customer_id, value } = data;
      await handleConfigUpdate(
        io,
        socket,
        "customer_layout",
        { customer_id },
        { direction: value },
        "layout_direction_updated"
      );
    });

    // Socket for updating prayer correction
    socket.on("update_prayer_correction", async ({ customer_id, value }) => {
      await handleConfigUpdate(
        io,
        socket,
        "customer_prayer_calc",
        { customer_id },
        { prayer_correction: JSON.stringify(value) },
        "prayer_correction_updated"
      );
    });

    // Socket for updating prayer correction
    socket.on("update_iqamah_correction", async ({ customer_id, value }) => {
      await handleConfigUpdate(
        io,
        socket,
        "customer_prayer_calc",
        { customer_id },
        { prayer_iqamah: JSON.stringify(value) },
        "iqamah_correction_updated"
      );
    });

    // Handle disconnection and cleanup
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      for (const [customer_id, sockets] of userSockets) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(customer_id);
          }
          break;
        }
      }
    });
  });
};

export { userSockets, io };

// Generic handler for updates
const handleConfigUpdate = async (
  io,
  socket,
  tableName,
  conditions,
  updates,
  emitEvent
) => {
  try {
    const result = await updateConfigInDB(tableName, conditions, updates);

    const customer_id = conditions.customer_id;
    const sockets = userSockets.get(customer_id);
    if (sockets) {
      const updatePayload = { customer_id, updates };
      sockets.forEach((socketId) => {
        io.to(socketId).emit(emitEvent, updatePayload);
      });
    }

    console.log(
      `Configuration updated in table ${tableName} for user ${customer_id}: ${JSON.stringify(
        updates
      )}`
    );
  } catch (error) {
    console.error(`Error updating configuration in table ${tableName}:`, error);
    socket.emit("error", { message: "Failed to update configuration" });
  }
};
