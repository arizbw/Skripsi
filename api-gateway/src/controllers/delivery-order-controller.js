import { HTTPResponse } from "../utils/response.js";
import {
  getAllDOAdminService,
  getAllDOsService,
  getDOByIDService,
} from "../services/delivery-order-service.js";

const getAllDOAdminController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (role.name === "Super" && type === "web") {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { deliveryOrders, total } = await getAllDOAdminService(skip, limit);
      const result = {
        deliveryOrders,
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

const getAllDOController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    console.log(type);
    const role = request.decodedToken.role;
    let { start_date = "", end_date = "", status = null } = request.query;
    if (role.name !== "Super" && role.is_allowed_do && type === "web") {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const dcId = role.dc_id;
      const { deliveryOrders, total } = await getAllDOsService(
        dcId,
        skip,
        limit,
        start_date,
        end_date,
        status
      );
      const result = {
        deliveryOrders,
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

const getDOByIDController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_do && type === "web") {
      const result = await getDOByIDService(request.params.doId);
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

export { getAllDOAdminController, getAllDOController, getDOByIDController };
