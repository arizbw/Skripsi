import { HTTPResponse } from "../utils/response.js";
import { getAllProductLineService } from "../services/product-line-service.js";
const getAllProductLineController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    if (type === "web") {
      const role = request.decodedToken.role;
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const productId = request.query.product_id;
      const doId = request.query.delivery_order_id;
      const dcId = role.dc_id;
      console.log(dcId);

      const { productLine, total } = await getAllProductLineService(
        dcId,
        doId || null,
        productId || null,
        skip,
        limit
      );
      const result = {
        productLine,
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
      response
        .status(403)
        .json(HTTPResponse(false, 403, null, null, "Unauthorized Device Type"));
    }
  } catch (error) {
    next(error);
  }
};

export { getAllProductLineController };
