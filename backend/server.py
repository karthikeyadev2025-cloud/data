"""Nikki Tech Labs — FastAPI backend entry."""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger("server")

from routes.auth_routes import router as auth_router
from routes.search_routes import router as search_router
from routes.tenant_routes import router as tenant_router
from routes.admin_routes import router as admin_router
from routes.payment_routes import router as payment_router

app = FastAPI(title="Nikki Tech Labs API", version="1.0.0")

api = APIRouter(prefix="/api")


@api.get("/")
def root():
    return {"ok": True, "name": "Nikki Tech Labs API", "version": "1.0.0"}


@api.get("/health")
def health():
    return {"status": "ok"}


api.include_router(auth_router)
api.include_router(search_router)
api.include_router(tenant_router)
api.include_router(admin_router)
api.include_router(payment_router)

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    log.info("Starting Nikki Tech Labs API...")
    try:
        from bootstrap import ensure_super_admin, ensure_dev_tenant
        ensure_super_admin()
        ensure_dev_tenant()
    except Exception as e:
        log.error(f"Bootstrap failed: {e}")
