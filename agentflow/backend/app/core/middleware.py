import time
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        logger.info(
            "%s %s %d %.3fs",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        response.headers["X-Response-Time"] = f"{duration:.3f}s"
        return response


async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
        })
    return JSONResponse(status_code=422, content={"detail": "Validation error", "errors": errors})


async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, str(exc))
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
