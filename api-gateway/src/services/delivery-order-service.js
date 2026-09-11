import {
  getAllDOsAdministrator,
  getAllDOs,
  getDOslbyID,
  createDO,
  updateDO,
} from "../repositories/delivery-order-repository.js";
const getAllDOAdminService = async (skip, limit) => {
  return await getAllDOsAdministrator(skip, limit);
};

const getAllDOsService = async (
  dc_id,
  skip,
  limit,
  start_date,
  end_date,
  status,
  customer_id,
  kabupaten_kota,
  so_origin,
  delivery_order_num
) => {
  return await getAllDOs(dc_id, skip, limit, start_date, end_date, status, customer_id, kabupaten_kota, so_origin, delivery_order_num);
};

const getDOByIDService = async (request) => {
  return await getDOslbyID(request);
};

const createDOService = async (doData, productLinesData, createdBy, dcId, customerId) => {
  return await createDO(doData, productLinesData, createdBy, dcId, customerId);
};

const updateDOService = async (id, doData, updatedBy, customerId) => {
  const dataToUpdate = { ...doData, updated_by: updatedBy };
  return await updateDO(id, dataToUpdate, customerId);
};

export { getAllDOAdminService, getAllDOsService, getDOByIDService, createDOService, updateDOService };
