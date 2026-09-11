import { HTTPResponse } from "../utils/response.js";
import {
  getAllTruckAdminService,
  getAllTrucksService,
  getTruckByIDService,
  getAllTruckTypesService,
  createTruckService,
  updateTruckService,
} from "../services/truck-service.js";

const getAllTruckAdminController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.name == "Super" && type == "web") {
      const result = await getAllTruckAdminService();
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
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
    if (role.name != "Super" && role.is_allowed_truck && type_device == "web") {
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
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

const getTruckByIDController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_truck && type == "web") {
      const result = await getTruckByIDService(request.params.truckId);
      response
        .status(200)
        .json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

const getAllTruckTypesController = async (request, response, next) => {
  try {
    const result = await getAllTruckTypesService();
    response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
  } catch (error) {
    next(error);
  }
};

const createTruckController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.name == "Super" && role.is_allowed_truck) {
      const {
        plate_number,
        type_id,
        first_status,
        second_status,
        dc_id,
        max_individual_capacity_volume
      } = request.body;

      const newTruckData = {
        plate_number,
        first_status: first_status || "AVAILABLE",
        created_by: request.decodedToken.userId || role.name,
      };

      if (type_id) newTruckData.type_id = parseInt(type_id);
      if (second_status) newTruckData.second_status = second_status;
      if (dc_id) newTruckData.dc_id = parseInt(dc_id);
      if (max_individual_capacity_volume) newTruckData.max_individual_capacity_volume = parseFloat(max_individual_capacity_volume);

      const result = await createTruckService(newTruckData);
      response.status(201).json(HTTPResponse(true, 201, "Success", result, null));
    } else {
      response.status(401).json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

const updateTruckController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_truck) {
      const {
        id,
        first_status,
        second_status,
        dc_id,
        max_individual_capacity_volume
      } = request.body;

      const updatedTruckData = {
        updated_by: request.decodedToken.userId || role.name,
      };

      if (first_status !== undefined) updatedTruckData.first_status = first_status;
      if (second_status !== undefined) updatedTruckData.second_status = second_status;
      if (dc_id) updatedTruckData.dc_id = parseInt(dc_id);
      if (max_individual_capacity_volume !== undefined && max_individual_capacity_volume !== null) updatedTruckData.max_individual_capacity_volume = parseFloat(max_individual_capacity_volume);

      const result = await updateTruckService(id, updatedTruckData);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(401).json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

export {
  getAllTruckAdminController,
  getAllTrucksController,
  getTruckByIDController,
  getAllTruckTypesController,
  createTruckController,
  updateTruckController,
};
