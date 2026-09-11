import ast
from typing import Optional, Literal
from pydantic import BaseModel, Field
from langchain.tools import tool


CREATE_REQUIRED_LOCATION_FIELDS = [
    "name", "address", "provinsi", "kabupaten_kota", "kecamatan",
    "desa_kelurahan", "kode_pos", "customer_id", "dc_id",
]


class LocationItemInput(BaseModel):
    id: Optional[str] = Field(
        default=None,
        description="Location UUID string (required for UPDATE). Must be the exact UUID from the database."
    )
    name: Optional[str] = Field(
        default=None,
        description="Location name (example: 'Toko ABC')."
    )
    latitude: Optional[float] = Field(
        default=None,
        description="Latitude coordinate (example: -6.1234)."
    )
    longitude: Optional[float] = Field(
        default=None,
        description="Longitude coordinate (example: 106.1234)."
    )
    address: Optional[str] = Field(
        default=None,
        description="Full address of the location (example: 'Jl. ABC No. 123')."
    )
    provinsi: Optional[str] = Field(
        default=None,
        description="Province name (example: 'DKI Jakarta')."
    )
    kabupaten_kota: Optional[str] = Field(
        default=None,
        description="City/Regency name (example: 'Jakarta Pusat')."
    )
    kecamatan: Optional[str] = Field(
        default=None,
        description="District name (example: 'Gambir')."
    )
    desa_kelurahan: Optional[str] = Field(
        default=None,
        description="Village/Urban Village name (example: 'Gambir')."
    )
    kode_pos: Optional[str] = Field(
        default=None,
        description="Postal code (example: '10110')."
    )
    open_hour: Optional[str] = Field(
        default=None,
        description="Opening hour of the location (example: '08:00')."
    )
    close_hour: Optional[str] = Field(
        default=None,
        description="Closing hour of the location (example: '17:00')."
    )
    service_time: Optional[int] = Field(
        default=None,
        description="Service time in minutes (example: 15)."
    )
    customer_id: Optional[int] = Field(
        default=None,
        description="Customer numeric ID. Can be replaced with customer_name."
    )
    customer_name: Optional[str] = Field(
        default=None,
        description="Customer name (example: 'PT ABC')."
    )
    dc_id: Optional[int] = Field(
        default=None,
        description="Distribution Center numeric ID. Can be replaced with dc_name."
    )
    dc_name: Optional[str] = Field(
        default=None,
        description="Distribution Center name (example: 'DC Jakarta')."
    )
    is_dc: Optional[bool] = Field(
        default=False,
        description="Whether the location is a Distribution Center."
    )


class ManageLocationInput(BaseModel):
    action: Literal["CREATE", "UPDATE"] = Field(
        description="Action to be performed on the location entity: 'CREATE' or 'UPDATE'."
    )
    data: LocationItemInput = Field(
        description="Location data object to be created or updated."
    )


from .db_utils import get_reference_mapping


def _resolve_location_names_to_ids(location_data: dict, db) -> list[str]:
    """Resolve and validate customer_name/customer_id and dc_name/dc_id in-place."""
    errors: list[str] = []
    try:
        cust_map, valid_cust_ids, cust_options = get_reference_mapping(db, "customer")
        c_name = location_data.get("customer_name")
        c_id = location_data.get("customer_id")
        if c_name:
            key = str(c_name).strip().lower()
            if key in cust_map:
                location_data["customer_id"] = cust_map[key]
            else:
                errors.append(f"Customer '{c_name}' not found in database. Options: {cust_options}")
        elif c_id is not None:
            if c_id not in valid_cust_ids:
                errors.append(f"Customer ID {c_id} not found in database. Options: {cust_options}")

        dc_map, valid_dc_ids, dc_options = get_reference_mapping(db, "dc")
        d_name = location_data.get("dc_name")
        d_id = location_data.get("dc_id")
        if d_name:
            key = str(d_name).strip().lower()
            if key in dc_map:
                location_data["dc_id"] = dc_map[key]
            else:
                errors.append(f"DC '{d_name}' not found in database. Options: {dc_options}")
        elif d_id is not None:
            if d_id not in valid_dc_ids:
                errors.append(f"DC ID {d_id} not found in database. Options: {dc_options}")
    except Exception as e:
        errors.append(f"Database reference error: {str(e)}")
    return errors

def _error(msg: str) -> dict:
    return {"status": "error", "ui_action": "ERROR", "message": msg}

def _success(ui_action: str, target: str, data, message: str) -> dict:
    return {"status": "success", "ui_action": ui_action, "target": target, "data": data, "message": message}

def get_manage_location_tool(db):
    @tool(args_schema=ManageLocationInput)
    def manage_location(action: str, data: LocationItemInput) -> dict:
        """
        Use this tool to prepare location data for CREATE or UPDATE and redirect the user to the location form.
        - action: 'CREATE' (requires name, address, provinsi, kabupaten_kota, kecamatan, desa_kelurahan, kode_pos, open_hour, close_hour, customer_name/customer_id, dc_name/dc_id)
                  'UPDATE' (requires id UUID string, plus any updatable fields).
        - data: Single location object (dict).
        
        Examples:
        - Create Location:
          manage_location(action="CREATE", data={"name": "Toko Makmur", "address": "Jl. Sudirman 10", "provinsi": "DKI Jakarta", "kabupaten_kota": "Jakarta Pusat", "kecamatan": "Gambir", "desa_kelurahan": "Gambir", "kode_pos": "10110", "open_hour": "08:00", "close_hour": "17:00", "customer_name": "PT ABC", "dc_name": "DC Jakarta"})
        - Update Location:
          manage_location(action="UPDATE", data={"id": "550e8400-e29b-41d4-a716-446655440000", "address": "Jl. Thamrin No. 20", "open_hour": "09:00"})
        """
        try:
            loc_dict: dict = data.model_dump(exclude_unset=True) if isinstance(data, BaseModel) else dict(data)
            action_upper = action.upper()

            resolve_errors = _resolve_location_names_to_ids(loc_dict, db)
            if resolve_errors:
                return _error("Error resolving location names:\n" + "\n".join(resolve_errors))

            if action_upper == "CREATE":
                missing = [f for f in CREATE_REQUIRED_LOCATION_FIELDS if loc_dict.get(f) is None]
                if missing:
                    return _error(f"Missing required fields for CREATE: {', '.join(missing)}.")

                return _success(
                    "PREFILL", "add_location", loc_dict,
                    "Data lokasi siap. Silakan periksa dan simpan di form."
                )

            elif action_upper == "UPDATE":
                location_id = loc_dict.get("id")
                if not location_id:
                    return _error("Missing required field 'id' for UPDATE location.")

                prefill = {
                    k: v for k, v in loc_dict.items()
                    if k not in {"id", "dc_name", "customer_name", "customer_id"}
                }
                prefill_data = {"Id": location_id, "prefill": prefill}
                return _success(
                    "PREFILL", "edit_location", prefill_data,
                    "Data lokasi siap diedit."
                )

            return _error("Action not known. Use 'CREATE' or 'UPDATE'.")
        except Exception as e:
            return _error(f"Unexpected error: {str(e)}")

    return manage_location
