from contextvars import ContextVar
from contextlib import contextmanager

# Context variable to store the JWT token of the current request
request_token: ContextVar[str] = ContextVar('request_token', default="")

# Context variable to store the current user's DC ID (None for Super Admin)
request_dc_id: ContextVar[int | None] = ContextVar('request_dc_id', default=None)

# Context variable to store the current user's role (e.g. 'Super', 'Admin DC')
request_role: ContextVar[str | None] = ContextVar('request_role', default=None)


@contextmanager
def set_request_context(
    token: str | None = None,
    dc_id: int | None = None,
    role: str | None = None,
):
    """
    Context manager to safely set and automatically reset request-scoped ContextVars.
    Prevents context bleeding across async tasks and worker threads.
    """
    token_t = request_token.set(token or "")
    dc_id_t = request_dc_id.set(dc_id)
    role_t = request_role.set(role)
    try:
        yield
    finally:
        request_token.reset(token_t)
        request_dc_id.reset(dc_id_t)
        request_role.reset(role_t)
