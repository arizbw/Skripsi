import { HTTPResponse } from "../utils/response.js";
import {
  getAllTruckAdminService,
  getAllTrucksService,
  getTruckByIDService,
} from "../services/truck-service.js";

const getAllTruckAdminController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.name === "Super" && type === "web") {
      const result = await getAllTruckAdminService();
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

const getAllTrucksController = async (request, response, next) => {
  try {
    const type_device = request.decodedToken.type;
    const role = request.decodedToken.role;
    let {
      first_status = null,
      second_status = null,
      type = null,
    } = request.query;
    if (role.name !== "Super" && role.is_allowed_truck && type_device === "web") {
      const dcId = role.dc_id;
      const trucks = await getAllTrucksService(
        dcId,
        first_status,
        second_status,
        type
      );
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", trucks, null));
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const getTruckByIDController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_truck && type === "web") {
      const result = await getTruckByIDService(request.params.truckId);
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

export {
  getAllTruckAdminController,
  getAllTrucksController,
  getTruckByIDController,
};
