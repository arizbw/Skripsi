import {
  customer_location_banten,
  customer_location_jakarta,
} from "./customer-data.js";

export const delivery_order_banten = Array.from({ length: 100 }, (_, i) => ({
  so_origin: `PRM/#SO-${(i + 1).toString().padStart(4, "0")}`,
  order_date: "2024-10-22T04:04:46Z",
  created_by: "Super",
  loc_ori_id: "54fd3b19-7843-4c8d-a923-82a2be39fb7b",
  loc_dest_id: customer_location_banten[i % customer_location_banten.length].id,
  delivery_order_num: `PRM/#DO-${(i + 1).toString().padStart(4, "0")}`,
}));

export const delivery_order_jakarta = Array.from({ length: 20 }, (_, i) => ({
  so_origin: `PRM/#SO-${(i + 101).toString().padStart(4, "0")}`,
  order_date: "2024-10-22T04:04:46Z",
  created_by: "Super",
  loc_ori_id: "368a8a8e-e57a-4cc0-8819-7eb9c42e9845",
  loc_dest_id:
    customer_location_jakarta[i % customer_location_jakarta.length].id,
  delivery_order_num: `PRM/#DO-${(i + 101).toString().padStart(4, "0")}`,
}));
