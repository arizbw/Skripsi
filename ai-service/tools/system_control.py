from typing import Optional, Literal
from pydantic import BaseModel, Field, model_validator
from langchain.tools import tool
from context import request_role


TargetPage = Literal[
    "dashboard",
    "shipments_list", "add_shipment", "edit_shipment", "detail_shipment",
    "trucks_list", "add_truck", "bulk_add_truck", "edit_truck", "bulk_edit_truck",
    "delivery_orders_list", "add_delivery_order", "edit_delivery_order", "detail_delivery_order",
    "locations_list", "add_location", "edit_location", "detail_location", 
    "products_line_list",
    "products_list",
    "customers_list", "detail_customer",
    "users_list",
    "roles_list",
]

PAGES_REQUIRING_ID = {
    "edit_shipment", "detail_shipment",
    "edit_truck",
    "edit_delivery_order", "detail_delivery_order",
    "edit_location", "detail_location",
    "detail_customer",
}

SUPER_ADMIN_RESTRICTED_PAGES = {
    "add_shipment", "edit_shipment", "detail_shipment",
    "add_delivery_order", "edit_delivery_order",
}

ADMIN_DC_RESTRICTED_PAGES = {
    "customers_list", "detail_customer",
    "users_list", "roles_list",
    "add_truck", "bulk_add_truck", "edit_truck", "bulk_edit_truck",
}


class SystemControlInput(BaseModel):
    target_page: TargetPage = Field(description="Target page UI to navigate to.")
    entity_id: Optional[int] = Field(default=None, description="Optional entity ID for navigating to detail or edit pages (example: 123).")

    @model_validator(mode="after")
    def check_entity_id_required(self):
        if self.target_page in PAGES_REQUIRING_ID and self.entity_id is None:
            raise ValueError(f"Target page '{self.target_page}' requires entity_id")
        return self


@tool(args_schema=SystemControlInput)
def system_control(target_page: str, entity_id: Optional[int] = None) -> dict:
    """
    Use this tool to navigate the UI and open specific pages (dashboard, list, add form, detail, edit).
    - For detail and edit pages ('edit_*', 'detail_*'), you MUST provide the database 'entity_id'.
    - Do NOT call this tool for data modification (use CRUD tools instead).
    
    Examples:
    - Open dashboard: system_control(target_page="dashboard")
    - Open trucks list: system_control(target_page="trucks_list")
    - Open detail shipment (ID 5): system_control(target_page="detail_shipment", entity_id=5)
    - Open edit truck (ID 12): system_control(target_page="edit_truck", entity_id=12)
    """
    role = (request_role.get() or "").strip().lower()
    
    # Check Super Admin restrictions
    if "super" in role:
        if target_page in SUPER_ADMIN_RESTRICTED_PAGES:
            return {
                "status": "error",
                "ui_action": "ERROR",
                "message": f"Access Denied. You don't have permission to access this page."
            }
    # Check Admin DC restrictions
    elif role:
        if target_page in ADMIN_DC_RESTRICTED_PAGES:
            return {
                "status": "error",
                "ui_action": "ERROR",
                "message": f"Access Denied. You don't have permission to access this page."
            }

    return {
        "status": "success",
        "ui_action": "NAVIGATE",
        "target": target_page,
        "entity_id": entity_id,
        "message": f"Mengarahkan Anda ke halaman {target_page.replace('_', ' ')}..."
    }
