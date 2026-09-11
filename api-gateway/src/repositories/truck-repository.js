import { prisma } from "../config/database.js";

async function getAllTruckAdmin() {
  const total = await prisma.truck.count();
  const result = await prisma.truck.findMany({
    select: {
      id: true,
      plate_number: true,
      first_status: true,
      second_status: true,
      max_individual_capacity_volume: true,
      type_id: true,
      dc_id: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
      truck_type: {
        select: {
          id: true,
          name: true,
        },
      },
      dc: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
  });
  return { trucks: result, total: total };
}

async function getAllTrucks(dc_id, first_status, second_status, type) {
  let dc_id_query = {};
  let first_status_query = {};
  let second_status_query = {};
  let type_query = {};

  if (dc_id != null) {
    dc_id_query = {
      dc_id: parseInt(dc_id),
    };
  }
  if (first_status != null) {
    first_status_query = {
      first_status: first_status,
    };
  }
  if (second_status != null) {
    second_status_query = {
      second_status: second_status,
    };
  }
  if (type != null) {
    type_query = {
      truck_type: {
        name: type,
      },
    };
  }

  const trucks = await prisma.truck.findMany({
    where: {
      AND: [dc_id_query, first_status_query, second_status_query, type_query],
    },
    select: {
      id: true,
      plate_number: true,
      first_status: true,
      second_status: true,
      max_individual_capacity_volume: true,
      type_id: true,
      dc_id: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
      truck_type: {
        select: {
          id: true,
          name: true,
        },
      },
      dc: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
  });

  return trucks;
}

async function getTruckbyID(truck_id) {
  return prisma.truck.findFirst({
    where: {
      id: parseInt(truck_id),
    },
    select: {
      id: true,
      plate_number: true,
      first_status: true,
      second_status: true,
      max_individual_capacity_volume: true,
      type_id: true,
      dc_id: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
      fuel_consumption_liters_per_km: true,
      truck_type: {
        select: {
          id: true,
          name: true,
        },
      },
      truck_cost: true,
      dc: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function getCostId(truck_id) {
  try {
    if (!truck_id || isNaN(truck_id)) {
      throw new Error("Invalid truck_id. Please provide a valid numeric ID.");
    }

    const result = await prisma.truckCost.findFirst({
      where: {
        truck_id: parseInt(truck_id), // Gunakan truck_id
      },
      select: {
        cost_id: true,
      },
    });

    // Jika result kosong
    if (!result || !result.cost_id) {
      throw new Error(`No cost_id found for truck_id ${truck_id}`);
    }

    return result.cost_id; // Kembalikan cost_id jika ditemukan
  } catch (error) {
    console.error("Error in getCostId:", error.message);
    throw error; // Lempar ulang error jika perlu
  }
}

async function getCost(cost_id) {
  return prisma.cost.findFirst({
    where: {
      id: parseInt(cost_id),
    },
    select: {
      cost_name: true,
      cost_value: true,
    },
  });
}

async function countTruck(dc_id) {
  return await prisma.truck.count({
    where: {
      ...(dc_id !== null ? { dc_id } : {}),
    },
  });
}

async function countAvailableTruck(dc_id) {
  return await prisma.truck.count({
    where: {
      first_status: "AVAILABLE",
      ...(dc_id !== null ? { dc_id } : {}),
    },
  });
}

async function getAllTruckTypes() {
  return await prisma.truckType.findMany();
}

async function createTruck(data) {
  return await prisma.truck.create({
    data: data
  });
}

async function updateTruck(id, data) {
  return await prisma.truck.update({
    where: { id: parseInt(id) },
    data: data
  });
}

export {
  getAllTruckAdmin,
  getAllTrucks,
  getTruckbyID,
  getCost,
  getCostId,
  countTruck,
  countAvailableTruck,
  getAllTruckTypes,
  createTruck,
  updateTruck,
};
