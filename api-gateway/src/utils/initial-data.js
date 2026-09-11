import { prisma } from "../config/database.js";
import { role } from "./dataset/static-data/role-data.js";
import { truck_types } from "./dataset/static-data/truck-type-data.js";
import { truck } from "./dataset/static-data/truck-data.js";
import { dcs } from "./dataset/static-data/dc-data.js";
import { user } from "./dataset/static-data/user-data.js";
import { dclocations } from "./dataset/static-data/dc-location-data.js";
import {
  customer_location_banten,
  customer_location_jakarta,
  customer_data,
} from "./dataset/customer-data.js";
import { product_data } from "./dataset/product-data.js";
import {
  delivery_order_banten,
  delivery_order_jakarta,
} from "./dataset/do-data.js";

function getRandomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function intialData() {
  console.log("checking if initial data is already created...");

  const existing = await prisma.dC.count();
  if (existing > 0) {
    console.log("✅ Initial data already exists. Skipping seeding.");
    return;
  }

  console.log("creating intial data....");

  await prisma.dC.createMany({
    data: dcs,
  });

  await prisma.role.createMany({
    data: role,
  });

  await prisma.truckType.createMany({
    data: truck_types,
  });

  await prisma.truck.createMany({
    data: truck,
  });

  await prisma.user.createMany({
    data: user,
  });

  await prisma.location.createMany({
    data: dclocations,
  });

  await prisma.customer.createMany({
    data: customer_data,
  });
  for (let index = 0; index < customer_location_jakarta.length; index++) {
    const customer_loc_jkt = customer_location_jakarta[index];
    customer_loc_jkt.open_hour = new Date(
      "0001-01-01T" + customer_loc_jkt.open_hour + ":00Z"
    );
    customer_loc_jkt.close_hour = new Date(
      "0001-01-01T" + customer_loc_jkt.close_hour + ":00Z"
    );

    await prisma.location.create({
      data: {
        id: customer_loc_jkt.id,
        name: customer_loc_jkt.name,
        latitude: customer_loc_jkt.latitude,
        longitude: customer_loc_jkt.longitude,
        address: customer_loc_jkt.address,
        provinsi: customer_loc_jkt.provinsi,
        kabupaten_kota: customer_loc_jkt.kabupaten_kota,
        kecamatan: customer_loc_jkt.kecamatan,
        desa_kelurahan: customer_loc_jkt.desa_kelurahan,
        kode_pos: customer_loc_jkt.kode_pos,
        is_dc: customer_loc_jkt.is_dc,
        service_time: customer_loc_jkt.service_time,
        open_hour: customer_loc_jkt.open_hour,
        close_hour: customer_loc_jkt.close_hour,
        created_by: customer_loc_jkt.created_by,
        dist_to_origin: customer_loc_jkt.dist_to_origin,
        service_time_unit: customer_loc_jkt.unit_service_time,
        customer: {
          connect: { id: customer_loc_jkt.customer_id },
        },
        dc: {
          connect: { id: customer_loc_jkt.dc_id },
        },
      },
    });
  }
  for (let index = 0; index < customer_location_banten.length; index++) {
    const customer_loc_btn = customer_location_banten[index];
    customer_loc_btn.open_hour = new Date(
      "0001-01-01T" + customer_loc_btn.open_hour + ":00Z"
    );
    customer_loc_btn.close_hour = new Date(
      "0001-01-01T" + customer_loc_btn.close_hour + ":00Z"
    );

    await prisma.location.create({
      data: {
        id: customer_loc_btn.id,
        name: customer_loc_btn.name,
        latitude: customer_loc_btn.latitude,
        longitude: customer_loc_btn.longitude,
        address: customer_loc_btn.address,
        provinsi: customer_loc_btn.provinsi,
        kabupaten_kota: customer_loc_btn.kabupaten_kota,
        kecamatan: customer_loc_btn.kecamatan,
        desa_kelurahan: customer_loc_btn.desa_kelurahan,
        kode_pos: customer_loc_btn.kode_pos,
        is_dc: customer_loc_btn.is_dc,
        service_time: customer_loc_btn.service_time,
        open_hour: customer_loc_btn.open_hour,
        close_hour: customer_loc_btn.close_hour,
        created_by: customer_loc_btn.created_by,
        dist_to_origin: customer_loc_btn.dist_to_origin,
        service_time_unit: customer_loc_btn.unit_service_time,
        customer: {
          connect: { id: customer_loc_btn.customer_id },
        },
        dc: {
          connect: { id: customer_loc_btn.dc_id },
        },
      },
    });
  }

  await prisma.product.createMany({
    data: product_data,
  });

  let x = [];
  for (let index = 0; index < delivery_order_banten.length; index++) {
    const delivery_order = delivery_order_banten[index];
    delivery_order.eta_target = "2024-10-25T06:09:39.000Z";
    const loc_dest = await prisma.location.findFirst({
      where: {
        id: delivery_order.loc_dest_id,
      },
    });

    if (loc_dest) {
      await prisma.deliveryOrder.create({
        data: delivery_order,
      });
    } else {
      x.push(order["loc_dest_id"]);
    }
  }

  let y = [];
  for (let index = 0; index < delivery_order_jakarta.length; index++) {
    const delivery_order = delivery_order_jakarta[index];
    delivery_order.eta_target = "2024-10-25T06:09:39.000Z";
    console.log(delivery_order.loc_dest_id);
    const loc_dest = await prisma.location.findFirst({
      where: {
        id: delivery_order.loc_dest_id,
      },
    });

    if (loc_dest) {
      await prisma.deliveryOrder.create({
        data: delivery_order,
      });
    } else {
      y.push(order["loc_dest_id"]);
    }
  }

  let product_line_data = [];
  let uniquePairs = new Set();

  for (let i = 0; i < 200; i++) {
    let delivery_order_id, product_id, uniqueKey;
    do {
      delivery_order_id = getRandomInt(1, 40);
      product_id = getRandomInt(1, 150);
      uniqueKey = `${delivery_order_id}-${product_id}`;
    } while (uniquePairs.has(uniqueKey));

    uniquePairs.add(uniqueKey);

    let volume = getRandomFloat(10, 100);
    let weight = getRandomFloat(1, 50);
    let quantity = getRandomInt(10, 100);
    let price = getRandomFloat(100000, 1000000);

    product_line_data.push({
      delivery_order_id: delivery_order_id,
      product_id: product_id,
      volume: parseFloat(volume),
      weight: parseFloat(weight),
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      unit_volume: "m\u00B3",
      unit_price: "rupiah",
      unit_weight: "kg",
      unit_quantity: "pcs",
    });
  }

  await prisma.productLine.createMany({
    data: product_line_data,
  });

  console.log("initial done.");
}
