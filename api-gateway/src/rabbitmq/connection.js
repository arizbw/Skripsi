import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
let connection = null;
let channel = null;
let isConnecting = false;

export const initRabbitMQ = async () => {
  if (connection && channel) {
    return channel;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (channel) return channel;
  }

  isConnecting = true;
  let retries = 10;
  while (retries > 0) {
    try {
      console.log(`[INIT] Connecting to RabbitMQ at ${RABBITMQ_URL.replace(/:([^:@]+)@/, ":***@")}...`);
      connection = await amqp.connect(RABBITMQ_URL, { heartbeat: 60 });
      
      connection.on("error", (err) => {
        console.error("[ERROR] RabbitMQ connection error:", err);
      });

      connection.on("close", () => {
        console.warn("[WARN] RabbitMQ connection closed. Reconnecting in 5 seconds...");
        connection = null;
        channel = null;
        setTimeout(() => {
          initRabbitMQ().catch((err) => console.error("[ERROR] Reconnection failed:", err));
        }, 5000);
      });

      channel = await connection.createChannel();
      
      channel.on("error", (err) => {
        console.error("[ERROR] RabbitMQ channel error:", err);
      });

      console.log("[DONE] RabbitMQ connected");
      break;
    } catch (err) {
      console.error(`[WAIT] RabbitMQ connection failed:`, err, `. Retrying in 5 seconds... (${retries} retries left)`);
      retries -= 1;
      if (retries === 0) {
        isConnecting = false;
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  isConnecting = false;
  return channel;
};

export const getChannel = async () => {
  if (channel) return channel;

  console.warn("[WAIT] Channel not ready. Waiting for reconnection (max 10s)...");
  const maxWaitMs = 10000;
  const interval = 500;
  let waited = 0;

  while (waited < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    waited += interval;
    if (channel) {
      console.log("[DONE] Channel ready after waiting.");
      return channel;
    }
  }

  throw new Error("[FAILED] RabbitMQ channel not available after 10 seconds. Please try again.");
};

export const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch (err) {
    console.error("[ERROR] Error closing RabbitMQ connection:", err);
  }
};
