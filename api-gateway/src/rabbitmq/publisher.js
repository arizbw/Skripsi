import { getChannel } from "./connection.js";
import dotenv from "dotenv";

dotenv.config();

const EXCHANGE = process.env.RABBITMQ_EXCHANGE;

export const publishBoxJob = async (payload) => {
  const channel = await getChannel();
  await channel.assertExchange(EXCHANGE, "direct", { durable: true });

  console.log("[PUBLISHER] Sending message to exchange");
  channel.publish(
    EXCHANGE,
    process.env.RABBITMQ_ROUTING_KEY,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
    }
  );

  const auditPayload = {
    box_id: payload.box_id,
    dgx_id: payload.dgx_id,
    action: "dispatched",
    timestamp: Date.now(),
  };

  channel.publish(
    EXCHANGE,
    process.env.RABBITMQ_AUDIT_KEY,
    Buffer.from(JSON.stringify(auditPayload)),
    {
      persistent: true,
    }
  );

  console.log("[DONE] Job sent:", payload);
};
