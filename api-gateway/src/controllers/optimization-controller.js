import { HTTPResponse } from "../utils/response.js";
import { priorityOptimizationService, saveBulkShipmentService } from "../services/optimization-service.js";
import { logger } from "../config/logging.js";

const priorityOptimizationController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    // Log inbound request context for debugging
    try {
      logger.info({
        msg: "priority-opt request received",
        path: request.originalUrl,
        method: request.method,
        user_type: type,
        role_id: role?.id,
        role_allowed_shipment: role?.is_allowed_shipment,
        headers: {
          dc_id: request.headers?.dc_id,
          content_type: request.headers?.["content-type"],
          origin: request.headers?.origin,
        },
        body: {
          delivery_orders_id: request.body?.delivery_orders_id,
          priority: request.body?.priority,
        },
      });
    } catch (_) {}
    if (role.is_allowed_shipment && type == "web") {
      const { shipments, failedDO, status } = await priorityOptimizationService(
        request
      );
      // Log service outcome before constructing response
      try {
        logger.info({
          msg: "priority-opt service result",
          status,
          shipments_count: Array.isArray(shipments) ? shipments.length : "undefined",
          failed_do_count: Array.isArray(failedDO) ? failedDO.length : "undefined",
          failed_do_preview: Array.isArray(failedDO) && failedDO.length > 0 ? failedDO[0] : null,
        });
      } catch (_) {}
      const safeShipments = Array.isArray(shipments) ? shipments : [];
      const safeFailed = Array.isArray(failedDO) ? failedDO : [];
      const responseData = {
        shipments: safeShipments,
        failed_delivery_orders: safeFailed, // return array for clarity
      };
      response
        .status(status || 200)
        .json(
          HTTPResponse(
            (status || 200) === 200,
            status || 200,
            (status || 200) === 200 ? "Success" : "Failed",
            responseData,
            null
          )
        );
    } else {
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    try {
      logger.error({
        msg: "priority-opt controller error",
        error_message: error?.message,
        stack: error?.stack,
      });
    } catch (_) {}
    next(error);
  }
};

const bulkSaveShipmentController = async (request, response, next) => {
  try {
    const type = request.decodedToken.type;
    const role = request.decodedToken.role;
    if (role.is_allowed_shipment && type == "web") {
      const { shipments, status } = await saveBulkShipmentService(request);
      response
        .status(status || 201)
        .json(
          HTTPResponse(
            true,
            status || 201,
            "Success",
            { shipments },
            null
          )
        );
    } else {
      response
        .status(401)
        .json(HTTPResponse(false, 401, null, null, "Unauthorized Role"));
    }
  } catch (error) {
    next(error);
  }
};

export { priorityOptimizationController, bulkSaveShipmentController };
