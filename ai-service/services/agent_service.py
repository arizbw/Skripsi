import json
import logging
import ast
from typing import Any
from sqlalchemy import text
from langchain_community.utilities.sql_database import SQLDatabase
from models.chat import ChatRequest, ChatResponse, CommandPayload, UserContext

logger = logging.getLogger("ai_service.agent")


def trace_agent_tools(response: Any, session_id: str) -> None:
    """Print tool calls and results returned by the LangGraph agent."""
    for message in response.get("messages", []):
        tool_calls = getattr(message, "tool_calls", None) or []
        for tool_call in tool_calls:
            print(
                f"[LLM TOOL CALL] session={session_id} "
                f"name={tool_call.get('name')} "
                f"args={json.dumps(tool_call.get('args', {}), default=str)}",
                flush=True,
            )

        if getattr(message, "type", None) == "tool":
            print(
                f"[LLM TOOL RESULT] session={session_id} "
                f"name={getattr(message, 'name', None)} "
                f"result={message.content}",
                flush=True,
            )


def build_system_context(user_context: UserContext | None, db: SQLDatabase | None) -> str | None:
    """
    Builds the dynamic system context string containing user role and DC restrictions.
    """
    if not user_context:
        return None

    ctx = user_context
    role_name = ctx.role or ("Admin DC" if ctx.dc_id else "Super")
    is_admin_dc = ctx.dc_id or "super" not in role_name.lower()

    if is_admin_dc:
        dc_info_parts = [f"dc_id={ctx.dc_id}"] if ctx.dc_id else []
        if ctx.dc_name:
            dc_info_parts.append(f"dc_name='{ctx.dc_name}'")
        elif ctx.dc_id and db and hasattr(db, "_engine") and db._engine:
            try:
                sql_dc = text("SELECT name FROM dc WHERE id = :dc_id")
                with db._engine.connect() as conn:
                    row = conn.execute(sql_dc, {"dc_id": ctx.dc_id}).fetchone()
                if row:
                    dc_info_parts.append(f"dc_name='{row[0]}'")
            except Exception as e:
                logger.debug(f"Failed to lookup DC name for id={ctx.dc_id}: {e}")

        dc_str = f" Their Distribution Center (DC) is fixed: {', '.join(dc_info_parts)}." if dc_info_parts else ""
        return (
            f"[SYSTEM CONTEXT] The current user is logged in as role '{role_name}'.{dc_str} "
            f"When creating a delivery order, use this dc_id automatically.\n"
            f"ROLE-BASED ACCESS RESTRICTIONS FOR ADMIN DC:\n"
            f"- RESTRICTED / FORBIDDEN PAGES: 'customers_list', 'detail_customer', 'users_list', 'roles_list', 'add_truck', 'bulk_add_truck', 'edit_truck', 'bulk_edit_truck'.\n"
            f"- RESTRICTED ACTIONS: Adding or editing truck data (manage_truck is prohibited).\n"
            f"- CRITICAL INSTRUCTION: If the user asks to navigate to, open, add, edit, or view details of any restricted customer, user, role, or truck create/edit page, you MUST REFUSE politely in Indonesian stating that Admin DC does not have permission. NEVER call system_control or manage_truck for these restricted items!"
        )
    else:
        return (
            f"[SYSTEM CONTEXT] The current user is logged in as role '{role_name}'. They do NOT have a fixed Distribution Center (DC).\n"
            f"ROLE-BASED ACCESS RESTRICTIONS FOR SUPER ADMIN:\n"
            f"- RESTRICTED / FORBIDDEN PAGES: 'add_shipment', 'edit_shipment', 'detail_shipment', 'add_delivery_order', 'edit_delivery_order'.\n"
            f"- RESTRICTED ACTIONS: Creating shipments (automate_shipment) and creating/updating delivery orders (manage_delivery_order).\n"
            f"- CRITICAL INSTRUCTION: If the user asks to navigate to, open, create, edit, or view details of shipments, or create/edit delivery orders, you MUST REFUSE politely in Indonesian stating that Super Admin does not have permission. NEVER call system_control, automate_shipment, or manage_delivery_order for these restricted items!"
        )


def _content_to_str(content: Any) -> str:
    """Normalizes LangChain message content (str | list[dict]) into a plain string."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(part.get("text") or str(part))
            else:
                parts.append(str(part))
        return "".join(parts)
    return str(content)


def parse_agent_response(response: dict, session_id: str) -> ChatResponse:
    """
    Parses messages from LangGraph agent execution, extracting the final text and any UI command payloads.
    """
    messages = response.get("messages", [])

    # Log trace to logger
    for msg in messages:
        msg_type = getattr(msg, "type", "")
        if msg_type == "ai":
            if getattr(msg, "tool_calls", None):
                logger.info(f"[{session_id}] AI Tool Calls: {msg.tool_calls}")
            elif msg.content:
                logger.debug(f"[{session_id}] AI Output: {msg.content}")
        elif msg_type == "tool":
            logger.info(f"[{session_id}] Tool Result ({getattr(msg, 'name', 'unknown')}): {msg.content}")

    # Extract the latest AI generated text response
    ai_reply_text = ""
    for msg in reversed(messages):
        if getattr(msg, "type", "") == "ai" and msg.content:
            text_content = _content_to_str(msg.content).strip()
            if text_content:
                ai_reply_text = text_content
                break

    # Extract UI command payload from tool execution
    command_payload: CommandPayload | None = None
    fallback_tool_message = ""

    for msg in reversed(messages):
        msg_type = getattr(msg, "type", "")
        msg_name = getattr(msg, "name", "")

        if msg_type == "tool" and msg_name in [
            "system_control", "manage_truck", "manage_location",
            "automate_shipment", "manage_delivery_order"
        ]:
            try:
                output = msg.content
                if isinstance(output, str):
                    try:
                        output = json.loads(output)
                    except json.JSONDecodeError:
                        output = ast.literal_eval(output)

                if isinstance(output, dict):
                    ui_action = output.get("ui_action")
                    if ui_action and ui_action != "ERROR":
                        fallback_tool_message = output.get("message", "")
                        data_payload = None
                        if "entity_id" in output and output["entity_id"] is not None:
                            data_payload = {"id": output["entity_id"], "Id": output["entity_id"]}
                        elif "data" in output and output["data"] is not None:
                            data_payload = output.get("data")

                        command_payload = CommandPayload(
                            type=ui_action,
                            target=output.get("target", "dashboard"),
                            data=data_payload,
                        )
                        break
                    elif ui_action == "ERROR" and not fallback_tool_message:
                        fallback_tool_message = output.get("message", "Terjadi kesalahan saat memproses data.")
            except Exception as e:
                logger.warning(f"Failed to parse tool output from {msg_name}: {e}")

        elif msg_type == "tool" and "SUCCESS:PREFILL:" in str(msg.content):
            try:
                obs_str = str(msg.content).strip()
                parts = obs_str.split(":", 3)
                target = parts[2] if len(parts) > 2 else "dashboard"
                json_str = parts[3].strip() if len(parts) > 3 else ""
                payload_data = json.loads(json_str) if json_str else {}

                command_payload = CommandPayload(
                    type="PREFILL",
                    target=target,
                    data=payload_data,
                )
                fallback_tool_message = "Baik, saya akan menyiapkan data yang Anda minta."
                break
            except Exception as e:
                logger.warning(f"Failed to parse legacy PREFILL tool output: {e}")

    # Determine final reply text
    if ai_reply_text:
        reply_text = ai_reply_text
    elif fallback_tool_message:
        reply_text = fallback_tool_message
    elif command_payload:
        reply_text = "Baik, saya akan mengarahkan Anda ke halaman yang relevan."
    else:
        reply_text = "Maaf, saya tidak dapat memproses permintaan tersebut."

    return ChatResponse(
        reply=reply_text,
        command=command_payload,
    )


async def execute_chat(agent: Any, request: ChatRequest, db: SQLDatabase | None = None) -> ChatResponse:
    """
    Executes the conversational agent with user context and returns a validated ChatResponse.
    """
    input_messages: list[dict[str, str]] = []
    
    system_context = build_system_context(request.user_context, db)
    if system_context:
        input_messages.append({"role": "system", "content": system_context})
    
    input_messages.append({"role": "user", "content": request.query})
    
    config = {"configurable": {"thread_id": request.session_id}}
    response = await agent.ainvoke({"messages": input_messages}, config=config)
    # trace_agent_tools(response, request.session_id)

    return parse_agent_response(response, request.session_id)
