import { HTTPResponse } from "../utils/response.js";
import {
  getAllLocationsAdminService,
  getAllLocationsService,
  getLocationByIDService,
} from "../services/locations-service.js";

const getAllLocationsAdminController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (
      (role.name === "Super" ||
        role.name === "Admin DC Banten" ||
        role.name === "Admin DC Jakarta") &&
      type === "web"
    ) {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { locations, total } = await getAllLocationsAdminService(
        skip,
        limit
      );
      const result = {
        locations,
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

const getAllLocationsController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (
      (role.name === "Super" ||
        role.name === "Admin DC Banten" ||
        role.name === "Admin DC Jakarta") &&
      type === "web"
    ) {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const dc_id = role.dc_id;
      const { locations, total } = await getAllLocationsService(
        dc_id,
        skip,
        limit
      );
      const result = {
        locations,
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

const getLocationByIdController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_location && type === "web") {
      const { lokasiId } = request.params;
      const result = await getLocationByIDService(lokasiId);
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
  getAllLocationsAdminController,
  getAllLocationsController,
  getLocationByIdController,
};
