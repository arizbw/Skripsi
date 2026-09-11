import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY;

const jwtMiddleware = async (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.decodedToken = jwt.verify(token, SECRET_KEY);

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export { jwtMiddleware };
