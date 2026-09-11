import { HTTPResponse } from "../utils/response.js";
import {
  getAllLocationsAdminService,
  getAllLocationsService,
  getLocationByIDService,
  createLocationService,
  updateLocationService,
} from "../services/locations-service.js";

const getAllLocationsAdminController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (
      (role.name == "Super" ||
        role.name == "Admin DC Banten" ||
        role.name == "Admin DC Jakarta") &&
      type == "web"
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
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
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
      (role.name == "Super" ||
        role.name == "Admin DC Banten" ||
        role.name == "Admin DC Jakarta") &&
      type == "web"
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
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

const getLocationByIdController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_location && type == "web") {
      const { lokasiId } = request.params;
      const result = await getLocationByIDService(lokasiId);
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

const createLocationController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.name == "Super" && role.is_allowed_location) {
      const {
        name,
        latitude,
        longitude,
        address,
        provinsi,
        kabupaten_kota,
        kecamatan,
        desa_kelurahan,
        kode_pos,
        open_hour,
        close_hour,
        customer_id,
        dc_id
      } = request.body;

      const newLocationData = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        provinsi,
        kabupaten_kota,
        kecamatan,
        desa_kelurahan,
        kode_pos: parseInt(kode_pos),
        open_hour: new Date(`1970-01-01T${open_hour}:00Z`),
        close_hour: new Date(`1970-01-01T${close_hour}:00Z`),
        created_by: request.decodedToken.userId || role.name,
      };

      if (name !== undefined) newLocationData.name = name;
      if (customer_id) newLocationData.customer_id = parseInt(customer_id);
      if (dc_id) newLocationData.dc_id = parseInt(dc_id);

      const result = await createLocationService(newLocationData);
      response.status(201).json(HTTPResponse(true, 201, "Success", result, null));
    } else {
      response.status(401).json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

const updateLocationController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.name == "Super" && role.is_allowed_location) {
      const {
        id,
        name,
        latitude,
        longitude,
        address,
        provinsi,
        kabupaten_kota,
        kecamatan,
        desa_kelurahan,
        kode_pos,
        open_hour,
        close_hour,
        customer_id,
        dc_id
      } = request.body;

      const updatedLocationData = {
        updated_by: request.decodedToken.userId || role.name,
      };

      if (name !== undefined) updatedLocationData.name = name;
      if (latitude !== undefined && latitude !== null) updatedLocationData.latitude = parseFloat(latitude);
      if (longitude !== undefined && longitude !== null) updatedLocationData.longitude = parseFloat(longitude);
      if (address !== undefined) updatedLocationData.address = address;
      if (provinsi !== undefined) updatedLocationData.provinsi = provinsi;
      if (kabupaten_kota !== undefined) updatedLocationData.kabupaten_kota = kabupaten_kota;
      if (kecamatan !== undefined) updatedLocationData.kecamatan = kecamatan;
      if (desa_kelurahan !== undefined) updatedLocationData.desa_kelurahan = desa_kelurahan;
      if (kode_pos !== undefined && kode_pos !== null) updatedLocationData.kode_pos = parseInt(kode_pos);
      if (open_hour !== undefined) updatedLocationData.open_hour = new Date(`1970-01-01T${open_hour}:00Z`);
      if (close_hour !== undefined) updatedLocationData.close_hour = new Date(`1970-01-01T${close_hour}:00Z`);
      if (customer_id !== undefined && customer_id !== null) updatedLocationData.customer_id = parseInt(customer_id);
      if (dc_id !== undefined && dc_id !== null) updatedLocationData.dc_id = parseInt(dc_id);

      const result = await updateLocationService(id, updatedLocationData);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      response.status(401).json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

export {
  getAllLocationsAdminController,
  getAllLocationsController,
  getLocationByIdController,
  createLocationController,
  updateLocationController,
};
