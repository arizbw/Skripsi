import { prisma } from "../config/database.js";

async function getAllShipmentAdmin(skip, limit) {
  const total = await prisma.shipment.count({
    where: {
      is_deleted: false,
    },
  });

  const shipment = await prisma.shipment.findMany({
    skip: skip,
    take: limit,
    where: {
      is_deleted: false,
    },
    select: {
      id: true,
      shipment_num: true,
      atd: true,
      eta: true,
      truck: {
        select: {
          id: true,
          plate_number: true,
        },
      },
      status: true,
      total_dist: true,
      total_time: true,
      total_time_with_waiting: true,
      total_volume: true,
      _count: {
        select: {
          ShipmentDO: true,
        },
      },
    },
  });

  return { total, shipment };
}
async function getShipments(dc_id, skip, limit) {
  let dc_query = {};
  if (dc_id != null && dc_id !== "null") {
    dc_query.dc_id = parseInt(dc_id);
  }
  const total = await prisma.shipment.count({
    where: {
      is_deleted: false,
      ShipmentLocation: {
        some: {
          location: dc_query,
        },
      },
    },
  });

  const shipment = await prisma.shipment.findMany({
    skip: skip,
    take: limit,
    where: {
      is_deleted: false,
      ShipmentLocation: {
        some: {
          location: dc_query,
        },
      },
    },
    select: {
      id: true,
      shipment_num: true,
      atd: true,
      eta: true,
      truck: {
        select: {
          id: true,
          plate_number: true,
        },
      },
      status: true,
      total_dist: true,
      total_time: true,
      total_time_with_waiting: true,
      total_volume: true,
      _count: {
        select: {
          ShipmentDO: true,
        },
      },
    },
  });

  return { total, shipment };
}

async function countShipment() {
  return await prisma.shipment.count({});
}

async function createShipment(data) {
  try {
    const shipment = await prisma.shipment.create({
      data: data,
    });
    return shipment;
  } catch (error) {
    console.error("Terjadi kesalahan saat membuat shipment:", error.message);
    throw error;
  }
}

async function createShipmentDO(data) {
  try {
    const shipment = await prisma.shipmentDO.create({
      data: data,
    });
    return shipment;
  } catch (error) {
    console.error("Terjadi kesalahan saat membuat shipmentdo:", error.message);
    throw error;
  }
}
async function createShipmentLocation(data) {
  try {
    const shipment = await prisma.shipmentLocation.create({
      data: data,
    });
    return shipment;
  } catch (error) {
    console.error(
      "Terjadi kesalahan saat membuat shipment location:",
      error.message
    );
    throw error;
  }
}

async function getShipmentsForMobile(dc_id, skip, limit) {
  try {
    let dcQuery = {};
    if (dc_id) {
      dcQuery = {
        ShipmentLocation: {
          some: {
            location: { dc_id: parseInt(dc_id) },
          },
        },
      };
    }

    const shipments = await prisma.shipment.findMany({
      skip: skip,
      take: limit,
      where: {
        is_deleted: false,
        status: { in: ["RUNNING", "DRAF"] },
        ...dcQuery,
      },
      select: {
        id: true,
        shipment_num: true,
        status: true,
        eta: true,
        total_dist: true,
        total_time: true,
        truck: {
          select: {
            plate_number: true,
          },
        },
        ShipmentDO: {
          select: {
            delivery_order: {
              select: {
                id: true,
                delivery_order_num: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.shipment.count({
      where: {
        is_deleted: false,
        status: { in: ["RUNNING", "DRAF"] },
        ...dcQuery,
      },
    });

    return { shipments, total };
  } catch (error) {
    throw error;
  }
}

async function getDetailShipmentByIdForMobile(id) {
  return await prisma.shipment.findFirst({
    where: {
      id: parseInt(id),
      is_deleted: false,
    },
    select: {
      id: true,
      shipment_num: true,
      status: true,
      eta: true,
      total_dist: true,
      total_time: true,
      truck: {
        select: {
          plate_number: true,
        },
      },
      ShipmentDO: {
        select: {
          delivery_order: {
            select: {
              id: true,
              delivery_order_num: true,
              BoxDO: {
                select: {
                  quantity: true,
                  box: {
                    select: {
                      id: true,
                      name: true,
                      height: true,
                      width: true,
                      length: true,
                      pcUrl: true,
                      scanned_at: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

async function searchShipmentsForMobile(shipment_num, dc_id) {
  return await prisma.shipment.findMany({
    where: {
      shipment_num: {
        contains: shipment_num,
        mode: "insensitive",
      },
      ...(dc_id && {
        ShipmentLocation: {
          some: {
            location: {
              dc_id: parseInt(dc_id),
            },
          },
        },
      }),
    },
    select: {
      id: true,
      shipment_num: true,
      status: true,
      eta: true,
      total_dist: true,
      total_time: true,
      truck: {
        select: {
          plate_number: true,
        },
      },
      ShipmentDO: {
        select: {
          delivery_order: {
            select: {
              id: true,
              delivery_order_num: true,
            },
          },
        },
      },
    },
  });
}

async function countDashboardShipment(dc_id) {
  return await prisma.shipment.count({
    where: {
      is_deleted: false,
      ...(dc_id !== null
        ? {
            ShipmentLocation: {
              some: {
                location: {
                  dc_id,
                },
              },
            },
          }
        : {}),
    },
  });
}

async function getDetailShipmentByIdForWeb(id) {
  return await prisma.shipment.findFirst({
    where: {
      id: parseInt(id),
      is_deleted: false,
    },
    include: {
      truck: {
        include: {
          truck_type: true,
          truck_cost: true,
          dc: true,
        },
      },
      ShipmentDO: {
        include: {
          delivery_order: {
            include: {
              ProductLine: true,
              BoxDO: {
                include: {
                  box: true,
                },
              },
              loc_ori: {
                include: {
                  dc: true,
                },
              },
              loc_dest: {
                include: {
                  dc: true,
                  customer: true,
                },
              },
            },
          },
        },
      },
      ShipmentLocation: {
        include: {
          location: {
            include: {
              dc: true,
              customer: true,
            },
          },
        },
        orderBy: {
          queue: "asc",
        },
      },
    },
  });
}

async function getShipmentByNum(shipmentNum) {
  return await prisma.shipment.findFirst({
    where: { shipment_num: shipmentNum },
    select: { id: true, truck_id: true },
  });
}

async function updateShipment(shipment_id, data) {
  return await prisma.shipment.update({
    where: {
      id: shipment_id,
    },
    data: data,
  });
}

async function updateTruckTypeByShipmentId(shipmentId, newTypeId) {
  // 1. Cari shipment untuk mendapatkan truck_id saat ini
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { truck_id: true }
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  // 2. Cari truck baru dengan status AVAILABLE dan type_id yang diinginkan
  const availableTruck = await prisma.truck.findFirst({
    where: {
      type_id: newTypeId,
      first_status: 'AVAILABLE',
    },
    select: { id: true }
  });

  if (!availableTruck) {
    throw new Error('No available truck with the specified type');
  }

  // 3. Mulai transaction untuk multiple updates
  return await prisma.$transaction([
    // Update truck lama ke status AVAILABLE (jika ada truck lama)
    ...(shipment.truck_id ? [
      prisma.truck.update({
        where: { id: shipment.truck_id },
        data: { first_status: 'AVAILABLE' }
      })
    ] : []),
    
    // Update shipment dengan truck baru
    prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        truck: {
          connect: { id: availableTruck.id }
        }
      },
      include: {
        truck: {
          include: {
            truck_type: true
          }
        }
      }
    }),
    
    // Update truck baru ke status UNAVAILABLE
    prisma.truck.update({
      where: { id: availableTruck.id },
      data: { first_status: 'UNAVAILABLE' }
    })
  ]).then((results) => {
    // Hasil dari update shipment adalah elemen terakhir dalam array
    return results[results.length - 1]; 
  });
}

export {
  getAllShipmentAdmin,
  getShipments,
  countShipment,
  createShipment,
  createShipmentDO,
  createShipmentLocation,
  getShipmentsForMobile,
  searchShipmentsForMobile,
  getDetailShipmentByIdForMobile,
  countDashboardShipment,
  getDetailShipmentByIdForWeb,
  getShipmentByNum,
  updateShipment,
  updateTruckTypeByShipmentId,
};
