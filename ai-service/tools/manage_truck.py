import ast
import re
from typing import Optional, List, Literal
from langchain.tools import tool
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import text


PLATE_NUMBER_REGEX = re.compile(
    r'^[A-Z]{1,2}\s[0-9]{1,4}\s[A-Z]{1,3}$',
    re.IGNORECASE
)
CREATE_REQUIRED_FIELDS = ["plate_number", "type_id", "dc_id", "max_individual_capacity_volume"]

UPDATE_ALLOWED_FIELDS: set[str] = {"dc_id", "dc_name", "first_status", "second_status"}

TruckFirstStatus  = Literal["AVAILABLE", "UNAVAILABLE"]
TruckSecondStatus = Literal["ON_DELIVERY", "OUT_OF_STOCK", "ARCHIVE", "MAINTENANCE", "LEGAL"]


class TruckItemInput(BaseModel):
    id: Optional[int] = Field(
        default=None,
        description="Numeric truck ID (used for UPDATE if plate_number is not available)."
    )
    plate_number: Optional[str] = Field(
        default=None,
        description="Indonesian truck license plate (example: 'B 1234 AB')."
    )
    type_id: Optional[int] = Field(
        default=None,
        description="Vehicle type ID. Can be replaced with type_name."
    )
    type_name: Optional[str] = Field(
        default=None,
        description="Vehicle type name (example: 'Blind Van', 'CDD', 'CDE')."
    )
    dc_id: Optional[int] = Field(
        default=None,
        description="Distribution Center ID. Can be replaced with dc_name."
    )
    dc_name: Optional[str] = Field(
        default=None,
        description="Distribution Center name (example: 'DC Jakarta')."
    )
    max_individual_capacity_volume: Optional[float] = Field(
        default=None,
        description="Maximum truck volume capacity (in cm³)."
    )
    first_status: Optional[TruckFirstStatus] = Field(
        default="AVAILABLE",
        description="Primary truck status: 'AVAILABLE' or 'UNAVAILABLE'."
    )
    second_status: Optional[TruckSecondStatus] = Field(
        default=None,
        description="Secondary truck status: 'ON_DELIVERY', 'MAINTENANCE', etc."
    )

    @field_validator("plate_number")
    @classmethod
    def check_plate_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip():
            v_stripped = v.strip().upper()
            if not PLATE_NUMBER_REGEX.match(v_stripped):
                raise ValueError(
                    f"Plate number format '{v}' is not valid. "
                    f"Must follow Indonesian format (example: 'B 1234 AB')."
                )
            return v_stripped
        return v

class ManageTruckInput(BaseModel):
    action: Literal["CREATE", "UPDATE"] = Field(
        description="Action to perform: 'CREATE' or 'UPDATE'."
    )
    data: List[TruckItemInput] = Field(
        description="List of trucks to be created or updated (minimum 1 item)."
    )

    @model_validator(mode="after")
    def validate_data_not_empty(self):
        if not self.data:
            raise ValueError("Parameter 'data' cannot be empty. Please provide at least 1 truck data.")
        return self


from .db_utils import get_reference_mapping

def _resolve_names_to_ids(truck_list: list[dict], db) -> list[str]:
    """Resolve and validate type_name/type_id and dc_name/dc_id against database records."""
    resolve_errors = []

    type_map, valid_type_ids, type_options = get_reference_mapping(db, "truck_type")
    dc_map, valid_dc_ids, dc_options = get_reference_mapping(db, "dc")
 
    for idx, truck in enumerate(truck_list):
        label = f"Truck #{idx+1}"

        # Validate / Resolve Truck Type
        t_name = truck.get("type_name")
        t_id = truck.get("type_id")
        if t_name:
            key = str(t_name).strip().lower()
            if key in type_map:
                truck["type_id"] = type_map[key]
            else:
                resolve_errors.append(
                    f"{label}: Truck type '{t_name}' not found in database. Options: {type_options}"
                )
        elif t_id is not None:
            if t_id not in valid_type_ids:
                resolve_errors.append(
                    f"{label}: Truck type ID {t_id} not found in database. Options: {type_options}"
                )

        # Validate / Resolve Distribution Center (DC)
        d_name = truck.get("dc_name")
        d_id = truck.get("dc_id")
        if d_name:
            key = str(d_name).strip().lower()
            if key in dc_map:
                truck["dc_id"] = dc_map[key]
            else:
                resolve_errors.append(
                    f"{label}: DC '{d_name}' not found in database. Options: {dc_options}"
                )
        elif d_id is not None:
            if d_id not in valid_dc_ids:
                resolve_errors.append(
                    f"{label}: DC ID {d_id} not found in database. Options: {dc_options}"
                )
 
    return resolve_errors

def _error(msg: str) -> dict:
    return {"status": "error", "ui_action": "ERROR", "message": msg}

def _success_prefill(target: str, data, message: str) -> dict:
    return {"status": "success", "ui_action": "PREFILL", "target": target, "data": data, "message": message}

def get_manage_truck_tool(db):
    @tool(args_schema=ManageTruckInput)
    def manage_truck(action: str, data: List[TruckItemInput]) -> dict:
        """
        Use this tool to prepare truck data for CREATE or UPDATE and redirect the user to the review page.
        - action: 'CREATE' (requires plate_number, type_name/type_id, dc_name/dc_id, max_individual_capacity_volume)
                  'UPDATE' (requires plate_number or id, plus updatable fields: dc_name/dc_id, first_status, second_status).
        - data: ALWAYS a list/array of truck objects (even for a single truck).
        
        Examples:
        - Create Single Truck:
          manage_truck(action="CREATE", data=[{"plate_number": "B 1234 AB", "type_name": "Blind Van", "dc_name": "DC Jakarta", "max_individual_capacity_volume": 1500000}])
        - Update Truck Status:
          manage_truck(action="UPDATE", data=[{"plate_number": "B 1234 AB", "first_status": "UNAVAILABLE", "second_status": "MAINTENANCE"}])
        - Bulk Create Trucks:
          manage_truck(action="CREATE", data=[{"plate_number": "B 1234 AB", "type_name": "CDD", "dc_name": "DC Jakarta", "max_individual_capacity_volume": 1000000}, {"plate_number": "D 5678 CD", "type_name": "CDE", "dc_name": "DC Bandung", "max_individual_capacity_volume": 2000000}])
        """
        try:
            from context import request_role
            role = (request_role.get() or "").strip().lower()
            if role and "super" not in role:
                return _error("Access Denied. You do not have permission to perform this action.")

            items: list[dict] = [
                item.model_dump(exclude_unset=True) if isinstance(item, BaseModel) else dict(item)
                for item in data
            ]
            resolve_errors = _resolve_names_to_ids(items, db)
            if resolve_errors:
                return _error("Failed to process data:\n" + "\n".join(resolve_errors))

            if action.upper() == "CREATE":
                return _handle_create(items, db)
            else:
                return _handle_update(items, db)

        except Exception as e:
            return _error(f"Unexpected error: {e}")

    def _handle_create(items: list[dict], db) -> dict:
        validated, errors = [], []
        seen_plates = set()
        sql_check = text("SELECT id FROM truck WHERE plate_number = :plate")

        for idx, truck in enumerate(items):
            label = f"Truck #{idx + 1}"
            missing = [f for f in CREATE_REQUIRED_FIELDS if not truck.get(f)]
            if missing:
                errors.append(f"{label}: missing required field ({', '.join(missing)})")
                continue

            plate = truck["plate_number"].strip().upper()
            truck["plate_number"] = plate

            # Check for duplicates in the current request batch
            if plate in seen_plates:
                errors.append(f"{label}: duplicate plate_number '{plate}' found in input batch.")
                continue
            seen_plates.add(plate)

            # Check if plate_number already exists in database
            try:
                with db._engine.connect() as conn:
                    existing = conn.execute(sql_check, {"plate": plate}).fetchone()
                if existing:
                    errors.append(f"{label}: truck with plate_number '{plate}' already exists in database (ID: {existing[0]}).")
                    continue
            except Exception:
                pass

            truck.setdefault("first_status", "AVAILABLE")
            validated.append(truck)

        if errors:
            return _error("Validation error for CREATE:\n" + "\n".join(errors))

        return _success_prefill(
            "bulk_add_truck", validated,
            "Data truk telah siap. Silahkan cek dan simpan di halaman review."
        )

    def _handle_update(items: list[dict], db) -> dict:
        validated, errors = [], []
        sql = text(
            "SELECT id, plate_number, type_id, dc_id, "
            "max_individual_capacity_volume, first_status, second_status "
            "FROM truck WHERE plate_number = :plate OR id = :id"
        )
        for idx, truck in enumerate(items):
            label = f"Truck #{idx + 1}"
            identifier = truck.get("plate_number") or truck.get("id")
            if not identifier:
                errors.append(f"{label}: plate_number or id is required for UPDATE.")
                continue

            # Reject fields that are not in the allowed update whitelist
            changed_fields = set(truck.keys()) - {"plate_number", "id"}
            forbidden = changed_fields - UPDATE_ALLOWED_FIELDS
            if forbidden:
                readable_allowed = ", ".join(sorted(UPDATE_ALLOWED_FIELDS))
                errors.append(
                    f"{label}: field(s) not allowed to be updated: {', '.join(sorted(forbidden))}. "
                    f"Only the following fields may be changed: {readable_allowed}."
                )
                continue

            ident_id = int(identifier) if str(identifier).isdigit() else 0
            with db._engine.connect() as conn:
                row = conn.execute(sql, {"plate": str(identifier), "id": ident_id}).fetchone()

            if not row:
                errors.append(f"{label}: truck with plate/id '{identifier}' not found.")
                continue

            db_id, db_plate, db_type, db_dc, db_vol, db_fs, db_ss = row
            validated.append({
                "id":          db_id,
                "plate_number": db_plate,
                "type_id":     db_type,
                "dc_id":       truck.get("dc_id", db_dc),
                "max_individual_capacity_volume": db_vol,
                "first_status":  truck.get("first_status") or db_fs,
                "second_status": truck.get("second_status", db_ss),
            })

        if errors:
            return _error("Invalid data:\n" + "\n".join(errors))

        return _success_prefill(
            "bulk_edit_truck", validated,
            "Data truk telah siap untuk diedit."
        )

    return manage_truck
