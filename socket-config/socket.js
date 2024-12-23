import { Server } from "socket.io";
import { updateConfigInDB } from "../handlers/configHandler.js";
import axios from "axios";
import fs from "fs";

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  fs.appendFileSync(
    "error.log",
    `${new Date().toISOString()} - Uncaught Exception: ${error.message}\n`
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  fs.appendFileSync(
    "error.log",
    `${new Date().toISOString()} - Unhandled Rejection: ${reason}\n`
  );
  process.exit(1);
});

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
      try {
        const { customer_id } = data;
        if (!userSockets.has(customer_id)) {
          userSockets.set(customer_id, new Set());
        }
        userSockets.get(customer_id).add(socket.id);
        await sendCountdown(customer_id);
        console.log(`User ${customer_id} registered with socket ${socket.id}`);
      } catch (error) {
        console.error("Error registering socket:", error);
        socket.emit("error", { message: "Failed to register socket" });
      }
    });

    // Socket for updating color
    socket.on("update_color", async (data) => {
      try {
        const { customer_id, value } = data;
        await updateConfigInDB(
          "customer_layout",
          { customer_id },
          { preview_color: value }
        );
        await handleConfigUpdate(
          io,
          socket,
          "customer_layout",
          { customer_id },
          { preview_color: value },
          "color_updated"
        );
      } catch (error) {
        console.error("Error updating color:", error);
        socket.emit("error", { message: "Failed to update color" });
      }
    });

    // Socket for updating running text
    socket.on("update_running_text", async (data) => {
      try {
        const { customer_id, value } = data;

        await handleConfigUpdate(
          io,
          socket,
          "customer_running_text",
          { customer_id },
          { text: value },
          "running_text_updated"
        );
      } catch (error) {
        console.error("Error updating running text:", error);
        socket.emit("error", { message: "Failed to update running text" });
      }
    });

    // Socket for updating running text speed
    socket.on("update_text_duration", async (data) => {
      try {
        const { customer_id, value } = data;
        await handleConfigUpdate(
          io,
          socket,
          "customer_running_text",
          { customer_id },
          { duration: value },
          "text_duration_updated"
        );
      } catch (error) {
        console.error("Error updating text duration:", error);
        socket.emit("error", { message: "Failed to update text duration" });
      }
    });

    // Socket for updating running text direction
    socket.on("update_text_direction", async (data) => {
      try {
        const { customer_id, value } = data;
        await handleConfigUpdate(
          io,
          socket,
          "customer_running_text",
          { customer_id },
          { direction: value },
          "text_direction_updated"
        );
      } catch (error) {
        console.error("Error updating text direction:", error);
        socket.emit("error", { message: "Failed to update text direction" });
      }
    });

    // Socket for updating layout direction
    socket.on("update_layout_direction", async (data) => {
      try {
        const { customer_id, value } = data;
        await handleConfigUpdate(
          io,
          socket,
          "customer_layout",
          { customer_id },
          { direction: value },
          "layout_direction_updated"
        );
      } catch (error) {
        console.error("Error updating layout direction:", error);
        socket.emit("error", { message: "Failed to update layout direction" });
      }
    });

    // Socket for updating prayer correction
    socket.on("update_prayer_correction", async ({ customer_id, value }) => {
      try {
        await handleConfigUpdate(
          io,
          socket,
          "customer_prayer_calc",
          { customer_id },
          { prayer_correction: JSON.stringify(value) },
          "prayer_correction_updated"
        );
      } catch (error) {
        console.error("Error updating prayer correction:", error);
        socket.emit("error", { message: "Failed to update prayer correction" });
      }
    });

    // Socket for updating iqamah correction
    socket.on("update_iqamah_correction", async ({ customer_id, value }) => {
      try {
        await handleConfigUpdate(
          io,
          socket,
          "customer_prayer_calc",
          { customer_id },
          { prayer_iqamah: JSON.stringify(value) },
          "iqamah_correction_updated"
        );
      } catch (error) {
        console.error("Error updating iqamah correction:", error);
        socket.emit("error", { message: "Failed to update iqamah correction" });
      }
    });

    // Update Prayer Location
    socket.on("update_prayer_method", async ({ customer_id, value }) => {
      try {
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
      } catch (error) {
        console.error("Error updating prayer method:", error);
        socket.emit("error", { message: "Failed to update prayer method" });
      }
    });

    // Update masjid details
    socket.on("update_masjid_details", async ({ customer_id, value }) => {
      try {
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
      } catch (error) {
        console.error("Error updating masjid details:", error);
        socket.emit("error", { message: "Failed to update masjid details" });
      }
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
    //For now stop DB updation via sockets

    // const result = await updateConfigInDB(tableName, conditions, updates);

    const customer_id = conditions.customer_id;
    const sockets = userSockets.get(customer_id);
    if (sockets) {
      const updatePayload = { customer_id, response: updates };
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

    const nextPrayerCountdown = data.nextPrayerCountdown;
    const activePrayer = data.activePrayer;
    const nextPrayerName = data.nextPrayerName;

    return { nextPrayerCountdown, activePrayer, nextPrayerName,timings:data.timings, iqamahTimings :data.iqamahTimings };
  } catch (error) {
    console.error("Error fetching prayer data:", error);
    return null;
  }
};

// Function to send countdown to user
const sendCountdown = async (customerId) => {
  const { nextPrayerCountdown, nextPrayerName, activePrayer, timings, iqamahTimings } =
    await fetchPrayerTimings(customerId);

  if (!nextPrayerCountdown || !nextPrayerName) return;

  let [hours, minutes, seconds] = nextPrayerCountdown.split(":").map(Number);

  // Get the regular prayer time and iqamah time for the active prayer
  const prayerTime = timings[activePrayer]; // example: "19:19"
  const iqamahTime = iqamahTimings[activePrayer]; // example: "19:34"

  // Calculate the difference in minutes between prayer time and iqamah time
  const [prayerHours, prayerMinutes] = prayerTime.split(":").map(Number);
  const [iqamahHours, iqamahMinutes] = iqamahTime.split(":").map(Number);

  // Convert prayer and iqamah times into total minutes from midnight
  const prayerTotalMinutes = prayerHours * 60 + prayerMinutes;
  const iqamahTotalMinutes = iqamahHours * 60 + iqamahMinutes;

  // Calculate the difference (in minutes) between iqamah time and prayer time
  const iqamahDelay = iqamahTotalMinutes - prayerTotalMinutes; // example: 15 minutes

  // Convert the next prayer countdown time into total seconds
  let countdownSeconds = hours * 3600 + minutes * 60 + seconds;

  const interval = setInterval(() => {
    const sockets = userSockets.get(customerId);

    if (sockets) {
      if (countdownSeconds > 0) {
        countdownSeconds--;
      } 
      else {
        const iqamahCountdown = iqamahDelay * 60; 
        let iqamahCountdownSeconds = iqamahCountdown;

        const iqamahInterval = setInterval(() => {
          if (iqamahCountdownSeconds > 0) {
            iqamahCountdownSeconds--;
          } else {
            const response = {
              message: `Iqamah time reached for ${activePrayer} prayer!`,
              activePrayer: activePrayer,
              isNavigation: true,
            };

            sockets.forEach((socketId) => {
              io.to(socketId).emit("iqamah_time_reached", {
                customer_id: customerId,
                response,
              });
            });

            clearInterval(iqamahInterval);
          }
        }, 1000);

        clearInterval(interval); 
      }

      const countdown = `${String(Math.floor(countdownSeconds / 3600)).padStart(2, "0")}:${String(
        Math.floor((countdownSeconds % 3600) / 60)
      ).padStart(2, "0")}:${String(countdownSeconds % 60).padStart(2, "0")}`;

      const response = {
        countdown,
        nextPrayerName,
        activePrayer,
      };

      sockets.forEach((socketId) => {
        io.to(socketId).emit("countdown", {
          customer_id: customerId,
          response,
        });
      });
    }
  }, 1000);
};

