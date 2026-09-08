import { HTTPResponse } from "../utils/response.js";
import {
  getAllShipmentAdminService,
  getAllShipmentService,
  getAllMobileShipmentsService,
  searchAllMobileShipmentsService,
  getDetailMobileShipmentService,
  getDetailShipmentWebService,
  simpanShipmentStatusService,
  getBoxLayoutingCoordinatesService,
  updateTruckTypeInShipmentService
} from "../services/shipment-service.js";

const getAllShipmentAdminController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.name === "Super" && type === "web") {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { shipment, total } = await getAllShipmentAdminService(skip, limit);
      const result = {
        shipment,
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

const getAllShipmentController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (role.name !== "Super" && role.is_allowed_shipment && type === "web") {
      const dc_id = parseInt(role.dc_id);
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { shipment, total } = await getAllShipmentService(
        dc_id,
        skip,
        limit
      );
      const result = {
        shipment,
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

const getAllMobileShipmentsController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_shipment && type === "mobile") {
      const limit = parseInt(request.query.limit) || 10;
      const skip = parseInt(request.query.skip) || 0;
      const { shipments, total } = await getAllMobileShipmentsService(
        request.decodedToken.role.dc_id,
        skip,
        limit
      );
      const result = {
        shipments,
        current_skip: skip,
        next_skip: skip + limit < total ? skip + limit : null,
        prev_skip: skip - limit >= 0 ? skip - limit : null,
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

const searchAllMobileShipmentsController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (role.is_allowed_shipment && type === "mobile") {
      const result = await searchAllMobileShipmentsService(request);
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

const getDetailMobileShipmentController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (role.is_allowed_shipment && type === "mobile") {
      const result = await getDetailMobileShipmentService(request.params.id);
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

const getDetailShipmentWebController = async (req, res, next) => {
  try {
    const role = req.decodedToken.role;
    const type = req.decodedToken.type;
    if ((role.is_allowed_shipment || role.name === "Super") && type === "web") {
      const result = await getDetailShipmentWebService(req.params.id);
      res.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      res.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const simpanShipmentStatusController = async (request, response, next) => {
  try {
    const role = request.decodedToken.role;
    if (role.is_allowed_shipment) {
      await simpanShipmentStatusService(request);
      response
        .status(200)
        .json(
          HTTPResponse(true, 200, "Status updated successfully", null, null)
        );
    } else {
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    next(error);
  }
};

const getBoxLayoutingCoordinatesController = async (
  request,
  response,
  next
) => {
  try {
    const startedAt = Date.now();
    console.log(`[BoxLayouting][Controller] START idShipment=%s role=%s type=%s`, request.params.idShipment, request?.decodedToken?.role?.name, request?.decodedToken?.type);
    const role = request.decodedToken.role;
    const type = request.decodedToken.type;
    if (role.is_allowed_shipment && type === "web") {
      const result = await getBoxLayoutingCoordinatesService(request.params.idShipment);
      const durationMs = Date.now() - startedAt;

      // Detect upstream error payload
      const isErrorArray = Array.isArray(result) && result.length > 0 && result[0] && result[0].error === true;
      if (isErrorArray) {
        console.warn(`[BoxLayouting][Controller] UPSTREAM FAIL idShipment=%s durationMs=%d`, request.params.idShipment, durationMs);
        return response
          .status(502)
          .json(HTTPResponse(false, 502, null, null, result[0].message || 'Upstream optimization service error'));
      }

      console.log(`[BoxLayouting][Controller] SUCCESS idShipment=%s durationMs=%d resultType=%s`, request.params.idShipment, durationMs, Array.isArray(result) ? 'array' : typeof result);
      response.status(200).json(HTTPResponse(true, 200, "Success", result, null));
    } else {
      console.warn(`[BoxLayouting][Controller] UNAUTHORIZED idShipment=%s roleAllowed=%s type=%s`, request.params.idShipment, role?.is_allowed_shipment, type);
      response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));
    }
  } catch (error) {
    console.error(`[BoxLayouting][Controller] ERROR idShipment=%s err=%s`, request.params?.idShipment, error?.message || error);
    next(error);
  }
};

const updateTruckTypeInShipmentController = async (req, res, next) => {
  try {
    const role = req.decodedToken.role;
    if (!role.is_allowed_shipment) {
      return response.status(403).json(HTTPResponse(false, 403, null, null, "Forbidden"));;
    }

    const shipmentId = parseInt(req.params.id);
    const newTypeId = parseInt(req.body.typeId); // 1 untuk Blind Van, 2 untuk CDE

    const updatedShipment = await updateTruckTypeInShipmentService(shipmentId, newTypeId);
    
    res.status(200).json(HTTPResponse(true, 200, "Truck updated successfully", updatedShipment, null));
  } catch (error) {
    res.status(400).json(HTTPResponse(false, 400, error.message, null, error.message));
  }
};

export {
  getAllShipmentAdminController,
  getAllShipmentController,
  getAllMobileShipmentsController,
  searchAllMobileShipmentsController,
  getDetailMobileShipmentController,
  getDetailShipmentWebController,
  simpanShipmentStatusController,
  getBoxLayoutingCoordinatesController,
  updateTruckTypeInShipmentController
};
