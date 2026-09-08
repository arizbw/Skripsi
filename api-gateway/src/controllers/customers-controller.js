import { HTTPResponse } from "../utils/response.js";
import {
  getAllCustomersService,
  getCustomerByIdService,
} from "../services/customers-service.js";

const getAllCustomersController = async (request, response, next) => {
  try {
    if (request.decodedToken.type === "web") {
      const dc_id = request.decodedToken.role.dc_id;
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { customers, total } = await getAllCustomersService(
        dc_id,
        skip,
        limit
      );
      const result = {
        customers,
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
      response.status(403).json(HTTPResponse(false, 403, null, null, "Unauthorized Device Type"));
    }
  } catch (error) {
    next(error);
  }
};

const getCustomerByIdController = async (request, response, next) => {
  try {
    if (request.decodedToken.type === "web") {
      const { customerId } = request.params;
      const result = await getCustomerByIdService(customerId);
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Unauthorized Device Type"));
    }
  } catch (error) {
    next(error);
  }
};

export { getAllCustomersController, getCustomerByIdController };
