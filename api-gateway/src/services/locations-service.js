import {
  getAllLocationsAdmin,
  getAllLocations,
  getLocationByID,
  createLocation,
  updateLocation,
} from "../repositories/locations-repository.js";

const getAllLocationsAdminService = async (skip, limit) => {
  return await getAllLocationsAdmin(skip, limit);
};

const getAllLocationsService = async (dc_id, skip, limit) => {
  return await getAllLocations(dc_id, skip, limit);
};

const getLocationByIDService = async (request) => {
  return await getLocationByID(request);
};

const createLocationService = async (data) => {
  return await createLocation(data);
};

const updateLocationService = async (id, data) => {
  return await updateLocation(id, data);
};

export {
  getAllLocationsAdminService,
  getAllLocationsService,
  getLocationByIDService,
  createLocationService,
  updateLocationService,
};
