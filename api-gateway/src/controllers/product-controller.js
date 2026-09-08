import { HTTPResponse } from "../utils/response.js";
import { getAllProductService } from "../services/product-service.js";
const getAllProductController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (
      (role.name === "Super" ||
        role.name === "Admin DC Banten" ||
        role.name === "Admin DC Jakarta") &&
      type === "web"
    ) {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { product, total } = await getAllProductService(skip, limit);
      const result = {
        product,
        current_skip: skip,
        next_skip: skip + limit,
        prev_skip: Math.max(0, skip - limit),
        per_page: limit,
        total: total,
      };
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

export { getAllProductController };
