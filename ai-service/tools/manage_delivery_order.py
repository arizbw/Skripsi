import ast
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from langchain.tools import tool
from sqlalchemy import text
from context import request_dc_id


DeliveryOrderStatus = Literal["READY", "PENDING", "RUNNING", "DONE", "IN_CALCULATION"]
CREATE_REQUIRED_DO_FIELDS = ["so_origin", "delivery_order_num", "eta_target", "status", "customer_id"]


class DeliveryOrderProductLineInput(BaseModel):
    product_id: Optional[int] = Field(
        default=None,
        description="Numeric ID of the product (can be replaced with product_name)."
    )
    product_name: Optional[str] = Field(
        default=None,
        description="Name of the product (example: 'Product A')."
    )
    quantity: Optional[float] = Field(
        default=1.0,
        description="Total quantity of the product."
    )
    volume: Optional[float] = Field(
        default=0.0,
        description="Total volume of the product."
    )
    weight: Optional[float] = Field(
        default=0.0,
        description="Total weight of the product."
    )
    price: Optional[float] = Field(
        default=0.0,
        description="Total price of the product."
    )


class DeliveryOrderItemInput(BaseModel):
    id: Optional[int] = Field(
        default=None,
        description="Numeric ID of the delivery order (required for UPDATE if delivery_order_num is not provided)."
    )
    so_origin: Optional[str] = Field(
        default=None,
        description="Sales Order number (example: 'SO-001')."
    )
    delivery_order_num: Optional[str] = Field(
        default=None,
        description="Delivery Order number (example: 'DO-001')."
    )
    eta_target: Optional[str] = Field(
        default=None,
        description="Target time of arrival in ISO 8601 format (example: '2026-06-13T08:00:00' or '2026-06-13')."
    )
    status: Optional[DeliveryOrderStatus] = Field(
        default=None,
        description="Delivery order status: 'READY', 'PENDING', 'RUNNING', 'DONE', atau 'IN_CALCULATION'."
    )
    dc_id: Optional[int] = Field(
        default=None,
        description="Distribution Center ID. Can be replaced with dc_name."
    )
    dc_name: Optional[str] = Field(
        default=None,
        description="Distribution Center name (example: 'DC Jakarta')."
    )
    customer_id: Optional[int] = Field(
        default=None,
        description="Customer ID. Can be replaced with customer_name."
    )
    customer_name: Optional[str] = Field(
        default=None,
        description="Customer name (example: 'PT ABC')."
    )
    description: Optional[str] = Field(
        default=None,
        description="Description or additional notes."
    )
    product_lines: Optional[List[DeliveryOrderProductLineInput]] = Field(
        default=None,
        description="List of products loaded in this delivery order."
    )

class ManageDeliveryOrderInput(BaseModel):
    action: Literal["CREATE", "UPDATE"] = Field(
        description="Action to be performed on the delivery order: 'CREATE' or 'UPDATE'."
    )
    data: DeliveryOrderItemInput = Field(
        description="Delivery order data object to be created or updated."
    )


from .db_utils import get_reference_mapping


def _resolve_do_names_to_ids(do_data: dict, db) -> list[str]:
    """
    Resolve and strictly validate customer_name/customer_id, dc_name/dc_id, and product_name/product_id in-place.
    """
    errors: list[str] = []
    try:
        cust_map, valid_cust_ids, cust_options = get_reference_mapping(db, "customer")
        c_name = do_data.get("customer_name")
        c_id = do_data.get("customer_id")
        if c_name:
            key = str(c_name).strip().lower()
            if key in cust_map:
                do_data["customer_id"] = cust_map[key]
            else:
                errors.append(f"Customer '{c_name}' not found in database. Options: {cust_options}")
        elif c_id is not None:
            if c_id not in valid_cust_ids:
                errors.append(f"Customer ID {c_id} not found in database. Options: {cust_options}")

        dc_map, valid_dc_ids, dc_options = get_reference_mapping(db, "dc")
        d_name = do_data.get("dc_name")
        d_id = do_data.get("dc_id")
        if d_name:
            key = str(d_name).strip().lower()
            if key in dc_map:
                do_data["dc_id"] = dc_map[key]
            else:
                errors.append(f"DC '{d_name}' not found in database. Options: {dc_options}")
        elif d_id is not None:
            if d_id not in valid_dc_ids:
                errors.append(f"DC ID {d_id} not found in database. Options: {dc_options}")

        if "product_lines" in do_data and isinstance(do_data["product_lines"], list):
            prod_map, valid_prod_ids, prod_options = get_reference_mapping(db, "product")
            for idx, pl in enumerate(do_data["product_lines"]):
                if isinstance(pl, dict):
                    p_name = pl.get("product_name")
                    p_id = pl.get("product_id")
                    if p_name:
                        key = str(p_name).strip().lower()
                        if key in prod_map:
                            pl["product_id"] = prod_map[key]
                        else:
                            errors.append(f"Produk #{idx+1} ('{p_name}') not found in database. Options: {prod_options}")
                    elif p_id is not None:
                        if p_id not in valid_prod_ids:
                            errors.append(f"Produk ID {p_id} not found in database. Options: {prod_options}")
    except Exception as e:
        errors.append(f"Database reference error: {str(e)}")
    return errors

def _error(msg: str) -> dict:
    return {"status": "error", "ui_action": "ERROR", "message": msg}

def _success(ui_action: str, target: str, data, message: str) -> dict:
    return {"status": "success", "ui_action": ui_action, "target": target, "data": data, "message": message}

def get_manage_delivery_order_tool(db):
    @tool(args_schema=ManageDeliveryOrderInput)
    def manage_delivery_order(action: str, data: DeliveryOrderItemInput) -> dict:
        """
        Use this tool to prepare delivery order data for CREATE or UPDATE and redirect the user to the delivery order form.
        - action: 'CREATE' (requires so_origin, delivery_order_num, eta_target, status, customer_name/customer_id, dc_name/dc_id)
                  'UPDATE' (requires id or delivery_order_num, plus updatable fields: status, customer_name/customer_id).
        - data: Single delivery order object (dict).
        
        Examples:
        - Create Delivery Order:
          manage_delivery_order(action="CREATE", data={"so_origin": "SO-001", "delivery_order_num": "DO-001", "eta_target": "2026-06-15T08:00:00", "status": "READY", "customer_name": "PT ABC", "dc_name": "DC Jakarta", "product_lines": [{"product_name": "Produk A", "quantity": 10}]})
        - Update Delivery Order Status:
          manage_delivery_order(action="UPDATE", data={"delivery_order_num": "DO-001", "status": "DONE"})
        """
        try:
            from context import request_role
            role = (request_role.get() or "").strip().lower()
            if "super" in role:
                return _error("Access Denied: Super Admin role does not have permission to create or update delivery orders.")

            do_dict: dict = data.model_dump(exclude_unset=True) if isinstance(data, BaseModel) else dict(data)
            action_upper = action.upper()

            resolve_errors = _resolve_do_names_to_ids(do_dict, db)
            if resolve_errors:
                return _error("Failed to process delivery order data:\n" + "\n".join(resolve_errors))

            if action_upper == "CREATE":
                if not do_dict.get("dc_id"):
                    ctx_dc_id = request_dc_id.get()
                    if ctx_dc_id:
                        do_dict["dc_id"] = ctx_dc_id

                missing = [f for f in CREATE_REQUIRED_DO_FIELDS if do_dict.get(f) is None]
                if missing:
                    return _error(f"Missing required fields for CREATE: {', '.join(missing)}.")

                prefill_data = {
                    "so_origin": do_dict["so_origin"],
                    "delivery_order_num": do_dict["delivery_order_num"],
                    "eta_target": do_dict["eta_target"],
                    "status": str(do_dict["status"]).upper(),
                    "customer_id": int(do_dict["customer_id"]),
                }
                if do_dict.get("dc_id") is not None:
                    prefill_data["dc_id"] = int(do_dict["dc_id"])
                if "description" in do_dict and do_dict["description"]:
                    prefill_data["description"] = do_dict["description"]
                if "product_lines" in do_dict and isinstance(do_dict["product_lines"], list):
                    prefill_data["product_lines"] = [
                        {
                            "product_id": int(pl.get("product_id", 0)),
                            "quantity": float(pl.get("quantity", 1.0)),
                            "volume": float(pl.get("volume", 0.0)),
                            "weight": float(pl.get("weight", 0.0)),
                            "price": float(pl.get("price", 0.0)),
                        }
                        for pl in do_dict["product_lines"]
                        if isinstance(pl, dict)
                    ]

                return _success(
                    "PREFILL", "add_delivery_order", prefill_data,
                    "Data delivery order telah disiapkan. Silakan periksa dan simpan di form yang akan dibuka."
                )

            elif action_upper == "UPDATE":
                do_id = do_dict.get("id")
                do_num = do_dict.get("delivery_order_num")

                if not do_id and not do_num:
                    return _error("For UPDATE, include 'id' (integer) or 'delivery_order_num' to identify the order.")

                if not do_id and do_num:
                    sql_find = text("SELECT id FROM delivery_order WHERE delivery_order_num = :num AND is_deleted = false LIMIT 1")
                    with db._engine.connect() as conn:
                        row = conn.execute(sql_find, {"num": str(do_num)}).fetchone()
                    if not row:
                        return _error(f"Delivery order with number '{do_num}' not found.")
                    do_id = row[0]

                if do_id is None:
                    return _error("Could not resolve a valid delivery order ID.")
                do_id = int(do_id)

                allowed_fields = {"status", "customer_id"}
                update_fields = {k: v for k, v in do_dict.items() if k in allowed_fields and v is not None}
                if not update_fields:
                    return _error("No fields to update. Updatable fields: status, customer_id.")

                if "status" in update_fields:
                    update_fields["status"] = str(update_fields["status"]).upper()

                prefill_data = {"id": do_id, **update_fields}

                return _success(
                    "PREFILL", "edit_delivery_order", prefill_data,
                    f"Data delivery order siap diedit. Silakan periksa dan simpan perubahan di form."
                )

            return _error("Unknown action. Use 'CREATE' or 'UPDATE'.")
        except Exception as e:
            return _error(f"Unexpected error: {str(e)}")

    return manage_delivery_order
