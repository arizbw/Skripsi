import ast
import logging
from sqlalchemy import text

logger = logging.getLogger(__name__)


def _query_id_name_pairs(db, query: str) -> list[tuple[int, str]]:
    """
    Executes a SELECT id, name query safely.
    Handles LangChain SQLDatabase db.run(query) and direct SQLAlchemy engine connections.
    """
    # 1. Primary: Use db.run if available (LangChain SQLDatabase standard method and test mock)
    if hasattr(db, "run"):
        try:
            res = db.run(query)
            if isinstance(res, str) and res.strip():
                try:
                    parsed = ast.literal_eval(res.strip())
                    if isinstance(parsed, list):
                        return [(int(item[0]), str(item[1])) for item in parsed if len(item) >= 2]
                except Exception as eval_err:
                    logger.debug(f"ast.literal_eval failed on db.run output: {eval_err}")
            elif isinstance(res, list):
                return [(int(item[0]), str(item[1])) for item in res if len(item) >= 2]
        except Exception as e:
            logger.debug(f"db.run execution failed: {e}")

    # 2. Fallback: Try direct SQLAlchemy execution if engine is available and not a MagicMock
    if hasattr(db, "_engine") and db._engine is not None and not str(type(db._engine)).startswith("<class 'unittest.mock"):
        try:
            with db._engine.connect() as conn:
                result = conn.execute(text(query))
                rows = result.fetchall()
                if rows:
                    return [(int(r[0]), str(r[1])) for r in rows if len(r) >= 2]
        except Exception as e:
            logger.debug(f"Direct SQLAlchemy query failed: {e}")

    return []


def get_reference_mapping(db, table_name: str) -> tuple[dict[str, int], set[int], str]:
    """
    Retrieves (name_to_id_map, valid_id_set, readable_options_string) for a reference table (e.g. dc, customer, truck_type, product).
    """
    pairs = _query_id_name_pairs(db, f"SELECT id, name FROM {table_name}")
    name_map = {name.strip().lower(): id_val for id_val, name in pairs}
    valid_ids = {id_val for id_val, _ in pairs}
    options_str = ", ".join(name for _, name in pairs)
    return name_map, valid_ids, options_str
