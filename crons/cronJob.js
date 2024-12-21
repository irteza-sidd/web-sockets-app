import cron from "node-cron";
import {
  resetNotifiedUsers,
  sendEventReminder,
} from "../handlers/eventReminder.js";
import { io } from "../socket-config/socket.js";

cron.schedule("* * * * *", () => {
  console.log("Running the event reminder job...");
  sendEventReminder(io);
});

cron.schedule("0 0 * * *", () => {
  resetNotifiedUsers();
});
