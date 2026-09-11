import {
  getAllShipmentAdmin,
  getShipments,
  getShipmentsForMobile,
  searchShipmentsForMobile,
  getDetailShipmentByIdForMobile,
  getDetailShipmentByIdForWeb,
  getShipmentByNum,
  updateShipment,
  updateTruckTypeByShipmentId,
} from "../repositories/shipment-repository.js";
import {
  getDeliveryOrdersByShipmentId,
  updateStatusDO,
} from "../repositories/delivery-order-repository.js";
import { prisma } from "../config/database.js";
import axios from "axios";

const getAllShipmentAdminService = async (skip, limit) => {
  return await getAllShipmentAdmin(skip, limit);
};

const getAllShipmentService = async (dc_id, skip, limit) => {
  return await getShipments(dc_id, skip, limit);
};

const getBoxLayoutingCoordinatesService = async (id) => {
  const startedAt = Date.now();
  console.log(`[BoxLayouting][Service] START shipmentId=%s`, id);
  // Fetch shipment details
  const shipment = await getDetailShipmentWebService(id);
  const apiUrl = process.env.DJANGO_URL + "/api/layouting";
  console.log(`[BoxLayouting][Service] Shipment fetched: num=%s DOs=%d routes=%d truck=%s apiUrl=%s`,
    shipment?.shipment_num,
    shipment?.delivery_orders?.length ?? -1,
    shipment?.location_routes?.length ?? -1,
    shipment?.truck?.truck_type?.name ?? 'N/A',
    apiUrl
  );

  const shipmentData = {};

  const doMap = {};
  shipment.delivery_orders.forEach(doItem => {
    doMap[doItem.loc_dest_id] = doItem;
  });

  // Process DOs in the order of location_routes
  shipment.location_routes.forEach(route => {
    const doItem = doMap[route.id];
    if (doItem) {
      const doKey = `${doItem.delivery_order_num}`;
      shipmentData[doKey] = {};

      doItem.boxes.forEach((box, boxIndex) => {
        shipmentData[doKey][boxIndex + 1] = [
          box.length,
          box.width,
          box.height,
          box.quantity
        ];
      });
    }
  });

  const rawContainerName = shipment.truck?.truck_type?.name || 'Blind Van';
  const normalizedContainer = String(rawContainerName).toUpperCase().replace(/\s+/g, '_'); // e.g., 'Blind Van' -> 'BLIND_VAN'
  const requestData = {
    shipment_data: shipmentData,
    container: normalizedContainer,
    shipment_id: id,
    shipment_num: shipment.shipment_num,
  };

  try {
    const reqStarted = Date.now();
    const response = await axios.post(apiUrl, requestData, {
      timeout: 30000, // 30s defensive timeout
      headers: {
        Authorization: process.env.OPTIMIZATION_KEY,
        'Content-Type': 'application/json',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });
    const reqDuration = Date.now() - reqStarted;
    const sizeBytes = Buffer.byteLength(JSON.stringify(response.data || {}));
    console.log(`[BoxLayouting][Service] UPSTREAM OK status=%d durationMs=%d sizeBytes=%d`, response.status, reqDuration, sizeBytes);
    const totalDuration = Date.now() - startedAt;
    console.log(`[BoxLayouting][Service] DONE shipmentId=%s totalDurationMs=%d`, id, totalDuration);
    return [response.data]
  } catch (error) {
    const totalDuration = Date.now() - startedAt;
    if (error.response) {
      console.error(`[BoxLayouting][Service] UPSTREAM ERROR status=%d data=%j durationMs=%d`, error.response.status, error.response.data, totalDuration);
    } else if (error.request) {
      console.error(`[BoxLayouting][Service] UPSTREAM NO-RESPONSE durationMs=%d err=%s`, totalDuration, error.message || error);
    } else {
      console.error(`[BoxLayouting][Service] ERROR durationMs=%d err=%s`, totalDuration, error.message || error);
    }
    // Surface error message to caller but keep response shape
    return [{ error: true, message: error.message || 'Unknown error calling optimization service' }]
  }
}

const getAllMobileShipmentsService = async (dc_id, skip, limit) => {
  const { shipments, total } = await getShipmentsForMobile(dc_id, skip, limit);
  return {
    shipments: shipments.map((s) => ({
      id: s.id,
      shipment_num: s.shipment_num,
      status: s.status,
      eta: s.eta,
    })),
    total,
  };
};

const getDetailMobileShipmentService = async (id) => {
  const s = await getDetailShipmentByIdForMobile(id);

  if (!s) {
    throw new Error("Shipment not found");
  }

  return {
    id: s.id,
    shipment_num: s.shipment_num,
    status: s.status,
    eta: s.eta,
    total_dist: s.total_dist,
    total_time: s.total_time,
    plate_number: s.truck?.plate_number || "",
    deliveryOrders: s.ShipmentDO.map((doItem) => ({
      id: doItem.delivery_order.id,
      delivery_order_num: doItem.delivery_order.delivery_order_num,
      boxes: doItem.delivery_order.BoxDO.map((boxDo) => ({
        id: boxDo.box.id,
        name: boxDo.box.name,
        height: boxDo.box.height,
        width: boxDo.box.width,
        length: boxDo.box.length,
        pcUrl: boxDo.box.pcUrl,
        scannedAt: boxDo.box.scanned_at,
        quantity: boxDo.quantity,
      })),
    })),
  };
};

const searchAllMobileShipmentsService = async (request) => {
  const dc_id = request.decodedToken.role.dc_id;
  const shipments = await searchShipmentsForMobile(
    request.query.shipment_num,
    dc_id
  );

  return shipments.map((s) => ({
    id: s.id,
    shipment_num: s.shipment_num,
    status: s.status,
    eta: s.eta,
  }));
};

const getDetailShipmentWebService = async (id) => {
  const shipment = await getDetailShipmentByIdForWeb(id);
  if (!shipment) throw new Error("Shipment not found");

  const truck = shipment.truck;
  const deliveryOrdersRaw = shipment.ShipmentDO.sort(
    (a, b) => a.queue - b.queue
  ).map((sdo) => sdo.delivery_order);

  const locationRoutes = shipment.ShipmentLocation.map((sl) => sl.location);

  // Get DC location from truck
  const dcLocation = truck?.dc_id ? await (async () => {
    const { getLocationByID } = await import("../repositories/locations-repository.js");
    const dcLocations = await prisma.location.findFirst({
      where: {
        dc_id: truck.dc_id,
        is_dc: true,
        is_deleted: false,
      },
      include: {
        dc: true,
        customer: true,
      },
    });
    return dcLocations;
  })() : null;

  // Prepend DC location to location routes if it exists
  const fullLocationRoutes = dcLocation ? [dcLocation, ...locationRoutes] : locationRoutes;

  const defaultStartTime = new Date();
  defaultStartTime.setHours(8, 0, 0, 0);

  let accumulatedMinutes = 0;

  // Add DC as first entry in additional_info with zero travel time/distance
  const dcAdditionalInfo = dcLocation ? {
    loc_dest_id: dcLocation.id,
    queue: 0,
    eta: defaultStartTime.toTimeString().split(" ")[0],
    travel_time: 0,
    travel_distance: 0,
  } : null;

  const additionalInfo = shipment.ShipmentLocation.map((sl) => {
    accumulatedMinutes += sl.travel_time ?? 0;
    const etaDate = new Date(
      defaultStartTime.getTime() + accumulatedMinutes * 60000
    );

    return {
      loc_dest_id: sl.location_id,
      queue: sl.queue,
      eta: etaDate.toTimeString().split(" ")[0],
      travel_time: sl.travel_time,
      travel_distance: sl.travel_distance,
    };
  });

  const fullAdditionalInfo = dcAdditionalInfo ? [dcAdditionalInfo, ...additionalInfo] : additionalInfo;

  const current_capacity = deliveryOrdersRaw.reduce((acc, do_) => {
    const productLines = do_.ProductLine ?? [];
    let orderDemand = 0;
    for (const pl of productLines) {
      if (pl.volume != null && pl.quantity != null) {
        orderDemand += pl.volume * pl.quantity;
      }
    }
    return acc + orderDemand;
  }, 0);

  const deliveryOrders = deliveryOrdersRaw.map(
    ({ ProductLine, BoxDO, ...do_ }) => ({
      ...do_,
      boxes:
        BoxDO?.map((bd) => ({
          ...bd.box,
          quantity: bd.quantity,
        })) ?? [],
    })
  );

  return {
    shipment_num: shipment.shipment_num,
    isSaved: shipment.isSaved,
    total_time: shipment.total_time,
    total_time_with_waiting: shipment.total_time_with_waiting,
    total_dist: shipment.total_dist,
    shipment_cost: shipment.shipment_cost,
    max_capacity: truck?.max_individual_capacity_volume ?? 0,
    current_capacity: current_capacity,
    truck,
    delivery_orders: deliveryOrders,
    location_routes: fullLocationRoutes,
    all_coords: JSON.parse(shipment.all_coords),
    additional_info: fullAdditionalInfo,
  };
};

const simpanShipmentStatusService = async (request) => {
  const shipmentNum = request.params.shipmentNum;

  const shipment = await getShipmentByNum(shipmentNum);

  if (!shipment) {
    console.error("Shipment not found");
    throw new Error("Shipment not found");
  }

  const newStatus = "RUNNING";

  console.log(`Updating shipment ${shipment.id} to status ${newStatus}`);
  await updateShipment(shipment.id, { status: newStatus, isSaved: true });

  if (shipment.truck_id) {
    console.log(`Updating truck ${shipment.truck_id} to status UNAVAILABLE and ON_DELIVERY`);
    await prisma.truck.update({
      where: { id: shipment.truck_id },
      data: { 
        first_status: "UNAVAILABLE", 
        second_status: "ON_DELIVERY"
      },
    });
  }

  const deliveryOrders = await getDeliveryOrdersByShipmentId(shipment.id);

  for (let order of deliveryOrders) {
    console.log(`Updating delivery order ${order.id} to status RUNNING`);
    await updateStatusDO("RUNNING", order.id);
  }
};

const updateTruckTypeInShipmentService = async (shipmentId, newTypeId) => {
  try {
    // Validasi input
    if (!shipmentId || !newTypeId) {
      throw new Error('Shipment ID and Truck Type ID are required');
    }

    const result = await updateTruckTypeByShipmentId(shipmentId, newTypeId);
    return result;
  } catch (error) {
    console.error("Failed to update truck in shipment:", error);
    throw error; // Biarkan controller menangani error
  }
};

export {
  getAllShipmentAdminService,
  getAllShipmentService,
  getAllMobileShipmentsService,
  searchAllMobileShipmentsService,
  getDetailMobileShipmentService,
  getDetailShipmentWebService,
  simpanShipmentStatusService,
  getBoxLayoutingCoordinatesService,
  updateTruckTypeInShipmentService
};
