from .system_control import system_control, SystemControlInput, TargetPage, PAGES_REQUIRING_ID
from .manage_truck import get_manage_truck_tool, ManageTruckInput, TruckItemInput
from .manage_location import get_manage_location_tool, ManageLocationInput, LocationItemInput
from .manage_delivery_order import get_manage_delivery_order_tool, ManageDeliveryOrderInput, DeliveryOrderItemInput, DeliveryOrderProductLineInput
from .automate_shipment import get_automate_shipment_tool, AutomateShipmentInput

def use_tools(db):
    """List of tools that used for the system"""
    return [
        system_control,
        get_manage_truck_tool(db),
        get_manage_location_tool(db),
        get_manage_delivery_order_tool(db),
        get_automate_shipment_tool(db),
    ]

__all__ = [
    "use_tools",
    "system_control",
    "SystemControlInput",
    "TargetPage",
    "PAGES_REQUIRING_ID",
    "get_manage_truck_tool",
    "ManageTruckInput",
    "TruckItemInput",
    "get_manage_location_tool",
    "ManageLocationInput",
    "LocationItemInput",
    "get_manage_delivery_order_tool",
    "ManageDeliveryOrderInput",
    "DeliveryOrderItemInput",
    "DeliveryOrderProductLineInput",
    "get_automate_shipment_tool",
    "AutomateShipmentInput",
]
