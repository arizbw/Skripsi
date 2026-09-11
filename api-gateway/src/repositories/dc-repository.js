import { prisma } from "../config/database.js";

async function getAllDC() {
  const result = await prisma.dC.findMany({
    where: {
      is_deleted: false,
    },
    select: {
      name: true,
      id: true,
    },
    orderBy: {
      updated_at: "desc",
    },
  });
  return result;
}

async function getDCbyID(id) {
  if (id) {
    const dc = await prisma.dC.findFirst({
      where: {
        id: id,
      },
    });
    return dc;
  } else {
    return null;
  }
}
export { getAllDC, getDCbyID };
