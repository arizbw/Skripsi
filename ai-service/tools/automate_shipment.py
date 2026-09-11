from typing import List, Literal
from pydantic import BaseModel, Field
from langchain.tools import tool


OptimizationType = Literal["distance", "emission", "load", "balance"]


class AutomateShipmentInput(BaseModel):
    optimization_type: OptimizationType = Field(
        description=(
            "Optimization strategy to use: "
            "'distance' (shortest route), 'emission' (lowest CO2 emissions), "
            "'load' (maximize truck load utilization), 'balance' (balance distance and load)."
        )
    )
    delivery_order_ids: List[int] = Field(
        description=(
            "List of delivery order integer IDs to include in the shipment (e.g. [3, 7, 15]). "
            "You MUST use sql_db_query first to find matching delivery order IDs with status = 'READY' "
            "and is_deleted = false before calling this tool."
        )
    )


def get_automate_shipment_tool(db):
    @tool(args_schema=AutomateShipmentInput)
    def automate_shipment(
        optimization_type: str,
        delivery_order_ids: list[int],
    ) -> dict:
        """
        Use this tool to automatically generate an optimized multi-order shipment route and open the preview page.
        - optimization_type (MANDATORY): 'distance' (shortest route), 'emission' (lowest CO2), 'load' (max payload capacity), or 'balance' (balance distance and load). If not specified by user, ASK FIRST before calling this tool.
        - delivery_order_ids (MANDATORY): List of integer order IDs with status = 'READY' and is_deleted = false. ALWAYS query database with sql_db_query first to retrieve valid integer IDs.
        
        Example:
        - Optimize orders [4, 11, 19] for shortest distance:
          automate_shipment(optimization_type="distance", delivery_order_ids=[4, 11, 19])
        """
        try:
            from context import request_role
            role = (request_role.get() or "").strip().lower()
            if "super" in role:
                return {
                    "ui_action": "ERROR",
                    "message": "Access Denied: Super Admin role does not have permission to create shipments."
                }

            VALID_TYPES = {"distance", "emission", "load", "balance"}
            if not optimization_type or optimization_type not in VALID_TYPES:
                return {
                    "ui_action": "ERROR",
                    "message": (
                        "Missing or invalid 'optimization_type'. "
                        "Must be one of: 'distance', 'emission', 'load', or 'balance'. "
                        "Ask the user which optimization type they want."
                    )
                }

            if not delivery_order_ids or not isinstance(delivery_order_ids, list) or len(delivery_order_ids) == 0:
                return {
                    "ui_action": "ERROR",
                    "message": (
                        "Missing or empty 'delivery_order_ids'. "
                        "You MUST query the database first using sql_db_query to find matching delivery order IDs "
                        "with status = 'READY' and is_deleted = false, then pass those IDs to automate_shipment."
                    )
                }

            payload = {
                "optimization_type": optimization_type,
                "delivery_order_ids": [i for i in delivery_order_ids],
                "auto_submit": True,
            }

            return {
                "ui_action": "PREFILL",
                "target": "automate_shipment",
                "data": payload,
                "message": "Memulai proses pembuatan rute pengiriman otomatis berdasarkan kriteria Anda.",
            }
        except Exception as e:
            return {"ui_action": "ERROR", "message": f"ERROR: {str(e)}"}

    return automate_shipment
