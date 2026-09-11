import express from "express";
import { logHttpRequest } from "./config/logging.js";
import { errorMiddleware } from "./middlewares/error-middleware.js";
import { publicRouter } from "./routes/public-route.js";
import { restrictedRouter } from "./routes/restricted-route.js";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(logHttpRequest);

app.use(publicRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(restrictedRouter);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: "Not Found",
    data: null,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorMiddleware);
