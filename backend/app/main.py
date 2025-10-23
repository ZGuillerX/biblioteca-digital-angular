from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.utils import get_openapi
import logging
import time
from config import settings
from database import DatabaseConnection, test_connection
from dotenv import load_dotenv
import os

load_dotenv()

# Importación de rutas
from routes import auth, books, loans, bulk_upload, reviews

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# instancia de FastAPI
app = FastAPI(
        title=settings.APP_NAME,
        description="API REST para sistema de gestión de biblioteca digital",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Autenticación", "description": "Registro, login y perfil"},
        {"name": "Libros", "description": "CRUD de libros"},
        {"name": "Préstamos", "description": "Gestión de préstamos de libros"},
        {"name": "Reseñas", "description": "Gestión de reseñas de libros"},
    ]
)

# ==================== AUTENTICACIÓN PARA SWAGGER ====================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="API REST para sistema de gestión de biblioteca digital",
        routes=app.routes,
    )
    
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    for path in openapi_schema["paths"].values():
        for method in path.values():
            if "security" not in method:
                method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema
# ==================== MIDDLEWARES ====================

# Configuracion CORS
VITE_API_URL = os.getenv("VITE_API_URL", "http://localhost:4201")

ALLOWED_ORIGINS = [
    VITE_API_URL,
    "http://localhost:4201",
    "http://127.0.0.1:4201",
    "https://radiopaque-prefashioned-jeri.ngrok-free.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Outgoing response: Status {response.status_code} - Time: {process_time:.3f}s")
    return response

# ==================== EVENTOS ====================

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 50)

    max_retries = 5
    retry_count = 0
    while retry_count < max_retries:
        try:
            DatabaseConnection.initialize_pool()
            if test_connection():
                logger.info("Conexión a MySQL exitosa")
                break
            else:
                raise Exception("Error al conectar con MySQL")
        except Exception as e:
            retry_count += 1
            logger.error(f"Failed to initialize database (attempt {retry_count}/{max_retries}): {str(e)}")
            if retry_count < max_retries:
                time.sleep(5)
            else:
                logger.error("Max retries reached. Exiting...")
                raise

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Cerrando aplicación...")
    logger.info("Aplicación cerrada correctamente")

# ==================== RUTAS PRINCIPALES ====================

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Bienvenido a {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    db_status = test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "version": settings.APP_VERSION
    }

# ==================== INCLUIR ROUTERS ====================

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(books.router, prefix="/api/books", tags=["Libros"])
app.include_router(loans.router, prefix="/api/loans", tags=["Préstamos"])
app.include_router(bulk_upload.router, prefix="/api/books", tags=["Libros"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reseñas"])
app.openapi = custom_openapi

# ==================== MANEJADOR DE ERRORES GLOBAL ====================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no manejado: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "Ha ocurrido un error interno en el servidor",
            "detail": str(exc) if settings.DEBUG else None
        }
    )

# ==================== PUNTO DE ENTRADA ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.DEBUG
    )