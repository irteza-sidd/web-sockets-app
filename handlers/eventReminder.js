import moment from "moment";
import db from "../config/database.js";
import { userSockets } from "../socket-config/socket.js";

const notifiedUsers = new Set();

const resetNotifiedUsers = () => {
  notifiedUsers.clear();
  console.log("Notified users list has been cleared for the day.");
};

const sendEventReminder = async (io) => {
  try {
    const tomorrow = moment().add(1, "days").format("YYYY-MM-DD");

    const [events] = await db.query(
      `SELECT customer_id, title, event_date
       FROM customer_events
       WHERE event_date = ?`,
      [tomorrow]
    );


    if (events.length > 0) {
      events.forEach((event) => {
        const { customer_id, title, event_date } = event;

        if (!notifiedUsers.has(customer_id)) {
          const sockets = userSockets.get(customer_id);
          if (sockets) {
            sockets.forEach((socketId) => {
              io.to(socketId).emit("event_reminder", {
                title,
                event_date,
                customer_id,
              });
            });

            notifiedUsers.add(customer_id);

            console.log(`Sent reminder for ${title} to user ${customer_id}`);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error sending event reminder:", error);
  }
};

export { sendEventReminder, resetNotifiedUsers };
