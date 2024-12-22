import { Server } from "socket.io";
import { updateConfigInDB } from "../handlers/configHandler.js";
import axios from "axios";
import moment from "moment";

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

    socket.on("register_socket", async (data) => {
      const { customer_id } = data;
      if (!userSockets.has(customer_id)) {
        userSockets.set(customer_id, new Set());
      }
      userSockets.get(customer_id).add(socket.id);
      await sendCountdown(customer_id);
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

    //Update Prayer Location
    socket.on("update_prayer_method", async ({ customer_id, value }) => {
      const praying_method = {
        id: value.id || "",
        name: value.name || "",
        latlong: value.latlong || "0,0",
        latitude: value.latitude || "0",
        longitude: value.longitude || "0",
      };

      socket.emit("prayer_method_updated", {
        customer_id,
        updated_prayer_method: praying_method,
      });
    });

    //Update masjid details
    socket.on("update_masjid_details", async ({ customer_id, value }) => {
      const { name, logo, address } = value;

      await handleConfigUpdate(
        io,
        socket,
        "customer_devices",
        { customer_id },
        {
          name,
          logo,
          address,
        },
        "masjid_details_updated"
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

const fetchPrayerTimings = async (customerId) => {
  try {
    const response = await axios.get(
      `https://app.almuezzin.com/api/customer-data/${customerId}`
    );
    const data = response.data;

    const timings = data.timings;
    const activePrayer = data.activePrayer;
    const nextPrayerName = data.nextPrayerName;

    return { timings, activePrayer, nextPrayerName };
  } catch (error) {
    console.error("Error fetching prayer data:", error);
    return null;
  }
};

const getFormattedTimeRemaining = (nextPrayerTime) => {
  const now = moment(); // Current time
  const nextPrayerMoment = moment(nextPrayerTime, "HH:mm");

  const diffInSeconds = nextPrayerMoment.diff(now, "seconds");
  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

// Function to send countdown to user
const sendCountdown = async (customerId) => {
  const { timings, nextPrayerName } = await fetchPrayerTimings(customerId);

  if (!timings || !nextPrayerName) return;

  const nextPrayerTime = timings[nextPrayerName];

  const interval = setInterval(() => {
    const formattedTime = getFormattedTimeRemaining(nextPrayerTime);
    const sockets = userSockets.get(customerId);

    if (sockets) {
      const updatePayload = {
        countdown: formattedTime,
        nextPrayerName,
      };
      sockets.forEach((socketId) => {
        io.to(socketId).emit("countdown", updatePayload);
      });
    }

    if (formattedTime === "00:00:00") {
      clearInterval(interval);

      if (sockets) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit("prayer_time_reached", {
            message: `It's time for ${nextPrayerName} prayer!`,
            nextPrayerName,
          });
        });
      }
      setTimeout(async () => {
        await sendCountdown(customerId);
      }, 1000);
    }
  }, 1000);
};
