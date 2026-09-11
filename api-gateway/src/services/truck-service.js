import {
  getAllTruckAdmin,
  getAllTrucks,
  getTruckbyID,
  getAllTruckTypes,
  createTruck,
  updateTruck,
} from "../repositories/truck-repository.js";

const getAllTruckAdminService = async () => {
  return await getAllTruckAdmin();
};

const getAllTrucksService = async (
  dc_id,
  first_status,
  second_status,
  type
) => {
  return await getAllTrucks(dc_id, first_status, second_status, type);
};

const getTruckByIDService = async (request) => {
  return await getTruckbyID(request);
};

const getAllTruckTypesService = async () => {
  return await getAllTruckTypes();
};

const createTruckService = async (data) => {
  return await createTruck(data);
};

const updateTruckService = async (id, data) => {
  return await updateTruck(id, data);
};

export { 
  getAllTruckAdminService, 
  getAllTrucksService, 
  getTruckByIDService,
  getAllTruckTypesService,
  createTruckService,
  updateTruckService,
};
