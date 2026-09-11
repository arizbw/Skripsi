import { prisma } from "../config/database.js";

async function getAllLocationsAdmin(skip, limit) {
  try {
    const total = await prisma.location.count({
      where: {
        is_deleted: false,
      },
    });

    const locations = await prisma.location.findMany({
      skip: skip,
      take: limit,
      where: {
        is_deleted: false,
      },
      orderBy: {
        updated_at: 'desc'
      },
      include: {
        ShipmentLocation: {
          include: {
            shipment: {
              include: {
                ShipmentDO: {
                  include: {
                    delivery_order: {
                      include: {
                        ProductLine: {
                          include: {
                            product: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        customer: true,
      },
    });

    if (locations.length === 0) {
      throw new Error("No locations found");
    }

    return { locations, total };
  } catch (error) {
    console.error("Error occurred in getAllLocations:", error.message);
    if (error.code === "P2021") {
      throw new Error("Table or model not found in the database");
    } else if (error.message === "No locations found") {
      throw new Error("No locations found in the database");
    } else {
      throw new Error("Failed to retrieve locations");
    }
  }
}

const getAllLocations = async (dc_id, skip, limit) => {
  try {
    let dcIdQuery = {};
    if (dc_id != null) {
      dcIdQuery = {
        dc_id: parseInt(dc_id),
      };
    }

    const total = await prisma.location.count({
      where: {
        AND: [dcIdQuery],
        is_deleted: false,
      },
    });

    const locations = await prisma.location.findMany({
      skip: skip,
      take: limit,
      where: {
        AND: [dcIdQuery, { is_dc: false }],
        is_deleted: false,
      },
      orderBy: {
        updated_at: 'desc'
      },
      include: {
        ShipmentLocation: {
          include: {
            shipment: {
              include: {
                ShipmentDO: {
                  include: {
                    delivery_order: {
                      include: {
                        ProductLine: {
                          include: {
                            product: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        customer: true,
      },
    });

    if (locations.length === 0) {
      throw new Error("No locations found");
    }

    return { locations, total };
  } catch (error) {
    console.error("Error occurred in getAllLocations:", error.message);
    if (error.code === "P2021") {
      throw new Error("Table or model not found in the database");
    } else if (error.message === "No locations found") {
      throw new Error("No locations found in the database");
    } else {
      throw new Error("Failed to retrieve locations");
    }
  }
};

async function getDCLocations(is_dc, dc_id) {
  return await prisma.location.findMany({
    where: {
      is_dc: is_dc,
      dc_id: dc_id,
      is_deleted: false,
    },
  });
}

async function getLocationByID(loc_id) {
  return await prisma.location.findFirst({
    where: {
      id: loc_id,
    },
    include: {
      dc: true,
      customer: true,
    },
  });
}

const getLocationByListId = async (list_id) => {
  try {
    const location = await prisma.location.findMany({
      where: {
        id: {
          in: list_id,
        },
      },
    });

    if (!location) {
      throw new Error("Location not found");
    }

    return location;
  } catch (error) {
    console.error("Error details: ", error);

    if (error.code === "P2025") {
      throw new Error("Location not found in the database");
    } else {
      throw new Error("Failed to retrieve location");
    }
  }
};

async function createLocation(data) {
  return await prisma.location.create({
    data: data,
  });
}

async function updateLocation(id, data) {
  return await prisma.location.update({
    where: { id: id },
    data: data,
  });
}

export {
  getAllLocationsAdmin,
  getAllLocations,
  getLocationByID,
  getLocationByListId,
  getDCLocations,
  createLocation,
  updateLocation,
};
