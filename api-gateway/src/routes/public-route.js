import express from "express";
import userController from "../controllers/user-controller.js";
import { apiKeyMiddleware } from "../middlewares/api-key-middleware.js";
import { returnBoxDimesionResultController } from "../controllers/box-controller.js";
import { getChannel } from "../rabbitmq/connection.js";

const publicRouter = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Check API health
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Gateway is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
publicRouter.get("/api/v1/health", (_, res) =>
  res.status(200).json({ success: true, message: "Gateway is running" })
);
/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     summary: Login for web users
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
publicRouter.post("/api/v1/login", userController.loginUserWebController);
/**
 * @swagger
 * /api/v1/mobile/login:
 *   post:
 *     summary: Login for mobile users
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
publicRouter.post(
  "/api/v1/mobile/login",
  userController.loginUserMobileController
);
/**
 * @swagger
 * /api/v1/box/dimension-result:
 *   post:
 *     summary: Submit box dimension result from ML service
 *     description: Endpoint for ML service to return calculated box dimensions
 *     tags: [Box]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - boxID
 *               - length
 *               - width
 *               - height
 *               - volume
 *             properties:
 *               boxID:
 *                 type: string
 *                 description: Box identifier
 *               length:
 *                 type: number
 *                 description: Box length in cm
 *               width:
 *                 type: number
 *                 description: Box width in cm
 *               height:
 *                 type: number
 *                 description: Box height in cm
 *               volume:
 *                 type: number
 *                 description: Box volume in cubic cm
 *     responses:
 *       200:
 *         description: Dimension result saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 error:
 *                   type: null
 *       400:
 *         description: Incomplete payload
 *       401:
 *         description: Invalid API key
 */
publicRouter.post(
  "/api/v1/box/dimension-result",
  apiKeyMiddleware,
  returnBoxDimesionResultController
);
/**
 * @swagger
 * /api/v1/rabbitmq/health:
 *   get:
 *     summary: Check RabbitMQ health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: RabbitMQ connected
 *       500:
 *         description: RabbitMQ NOT connected
 */
publicRouter.get("/api/v1/rabbitmq/health", async (_, res) => {
  try {
    const channel = await getChannel();

    const isClosed =
      !channel.connection ||
      channel.connection.closing ||
      channel.connection._closed;

    if (isClosed) {
      throw new Error("Channel or connection is closed");
    }

    res.status(200).json({ success: true, message: "RabbitMQ connected" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "RabbitMQ NOT connected",
      error: err.message,
    });
  }
});

export { publicRouter };
