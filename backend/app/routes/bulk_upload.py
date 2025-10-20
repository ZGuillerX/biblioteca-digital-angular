from fastapi import APIRouter, status, UploadFile, HTTPException, Depends, File
from services.google_books_service import search_book_by_isbn
from typing import Dict, Any
from io import BytesIO
import pandas as pd
import logging
import asyncio

from database import execute_query
from routes.auth import require_admin

# configuracion del  logging
logger = logging.getLogger(__name__)

# creacion del router
router = APIRouter()

MAX_FILE_SIZE = 1024 * 10 # 1 KB
TIMEOUT_SECONDS = 10

# Valida que un ISBN-13 sea correcto según su dígito verificador
def is_valid_isbn13(isbn: str) -> bool:
  
    isbn = isbn.replace("-", "").strip()
    if not isbn.isdigit() or len(isbn) != 13:
        return False
    total = sum((int(num) if i % 2 == 0 else int(num) * 3) for i, num in enumerate(isbn[:-1]))
    check = (10 - (total % 10)) % 10
    return check == int(isbn[-1])


# esta funcion valida que el archivo subido sea Excel y no exceda el tamaño máximo
def validate_excel_file(filename: str, contents: bytes) -> None:

    # formato del archivo 
    if not filename.endswith(('.xlsx', '.xls')):
        logger.warning(f"Intento de subir archivo no-Excel: {filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser formato Excel (.xlsx o .xls)"
        )

    # tamaño máximo 
    if len(contents) > MAX_FILE_SIZE:
        logger.warning(f"Archivo demasiado grande: {len(contents)} bytes")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo excede el tamaño máximo permitido (1 KB)"
        )

# Lee el contenido de un archivo Excel y lo convierte en DataFrame.
def read_excel_file(contents: bytes) -> pd.DataFrame:
 
    try:
        df = pd.read_excel(BytesIO(contents))
        return df
    except Exception as e:
        logger.error(f"Error leyendo Excel: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al leer archivo Excel: {str(e)}"
        )

#  Valida que el DataFrame contenga todas las columnas requeridas
def validate_required_columns(df: pd.DataFrame) -> None:
 
    # Columnas requeridas
    required_columns = ['title', 'author', 'isbn']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Columnas requeridas faltantes: {', '.join(missing_columns)}"
        )


# Extrae y procesa los datos de un libro desde una fila del DataFrame
def extract_book_data(row: pd.Series) -> Dict[str, Any]:
    
    book_data = {
        'title': str(row.get('title', '')).strip(),
        'author': str(row.get('author', '')).strip(),
        'isbn': str(row.get('isbn', '')).strip(),
        'description': str(row.get('description', '')).strip() if pd.notna(row.get('description')) else None,
        'category': str(row.get('category', '')).strip() if pd.notna(row.get('category')) else None,
        'publication_year': int(row['publication_year']) if pd.notna(row.get('publication_year')) else None,
        'total_copies': int(row.get('total_copies', 1)),
        'available_copies': int(row.get('available_copies', row.get('total_copies', 1))),
        'cover_url': str(row.get('cover_url', '')).strip() if pd.notna(row.get('cover_url')) else None
    }

    # Diccionario con los datos del libro procesados
    return book_data

#  Enriquece los datos de un libro con información de Google Books API.=
def enrich_book_with_google_data(book_data: Dict[str, Any], isbn: str) -> bool:
  
    # --- Enriquecer con Google Books---
    google_data = search_book_by_isbn(isbn)
    if google_data:
        for key in ['description', 'category', 'publication_year', 'cover_url']:
            if not book_data.get(key) and google_data.get(key):
                book_data[key] = google_data[key]
        return True
    
    # datos de Google Books, False en caso contrario
    return False


#  Inserta un libro en la base de datos
def insert_book_to_database(book_data: Dict[str, Any]) -> None:
   
    execute_query(
        """
        INSERT INTO books (title, author, isbn, description, category,
                           publication_year, total_copies, available_copies, cover_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            book_data['title'], book_data['author'], book_data['isbn'],
            book_data['description'], book_data['category'], book_data['publication_year'],
            book_data['total_copies'], book_data['available_copies'], book_data['cover_url']
        ),
        fetch=False
    )


# Procesa todas las filas del DataFrame e intenta insertar cada libro en la base de datos
def process_dataframe(df: pd.DataFrame, enrich_with_google: bool) -> Dict[str, Any]:
    results = {'success': [], 'errors': [], 'skipped': [], 'enriched': []}

    for index, row in df.iterrows():
        try:
            book_data = extract_book_data(row)
            title = book_data['title']
            author = book_data['author']
            isbn = book_data['isbn']

            if not title or not author or not isbn:
                results['skipped'].append({
                    'row': index + 2,
                    'reason': 'Datos incompletos (título, autor o ISBN faltante)'
                })
                continue

            # --- Validar ISBN-13 ---
            if not is_valid_isbn13(isbn):
                results['skipped'].append({
                    'row': index + 2,
                    'isbn': isbn,
                    'reason': 'ISBN-13 inválido'
                })
                continue

            existing = execute_query("SELECT id FROM books WHERE isbn = %s", (isbn,))
            if existing:
                results['skipped'].append({
                    'row': index + 2,
                    'isbn': isbn,
                    'reason': 'ISBN ya existente'
                })
                continue

            if enrich_with_google:
                was_enriched = enrich_book_with_google_data(book_data, isbn)
                if was_enriched:
                    results['enriched'].append({'row': index + 2, 'isbn': isbn, 'title': title})

            insert_book_to_database(book_data)
            results['success'].append({'row': index + 2, 'isbn': isbn, 'title': title})

        except Exception as e:
            logger.error(f"Error procesando fila {index + 2}: {e}")
            results['errors'].append({
                'row': index + 2,
                'isbn': isbn if 'isbn' in locals() else 'N/A',
                'error': str(e)
            })

    return results


# resumen de la carga masiva con estadísticas y detalles
def create_summary_response(df: pd.DataFrame, results: Dict[str, Any], username: str) -> Dict[str, Any]:
   
    summary = {
        'total_rows': len(df),
        'successful': len(results['success']),
        'errors': len(results['errors']),
        'skipped': len(results['skipped']),
        'enriched': len(results['enriched'])
    }

    logger.info(f"Carga masiva completada por {username}: {summary}")

# aqui retorna el diccionario con el mensaje, resumen y detalles de la carga
    return {
        'message': 'Carga masiva completada',
        'summary': summary,
        'details': results
    }

# en est aparte s procesa el archivo de carga masiva completo
async def process_bulk_upload(contents: bytes, enrich_with_google: bool, username: str) -> Dict[str, Any]:
    df = read_excel_file(contents)
    validate_required_columns(df)
    results = process_dataframe(df, enrich_with_google)
    return create_summary_response(df, results, username)


# Carga masiva de libros desde archivo Excel
# Requiere permisos de administrador

#  este endpont es  para la carga masiva de libros desde un archivo excel
@router.post("/bulk-upload", status_code=status.HTTP_201_CREATED)
async def bulk_upload_books(
    file: UploadFile = File(...),
    enrich_with_google: bool = False,
    current_user: dict = Depends(require_admin)
):

    try:
        validate_excel_file(file.filename, await file.read())
        contents = await file.read()
        await file.seek(0)
        contents = await file.read()

        # se ejecutar con límite de tiempo
        try:
            return await asyncio.wait_for(
                process_bulk_upload(contents, enrich_with_google, current_user['username']),
                timeout=TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            logger.error("Tiempo de procesamiento excedido")
            raise HTTPException(
                status_code=status.HTTP_408_REQUEST_TIMEOUT,
                detail=f"El procesamiento excedió el límite de tiempo de {TIMEOUT_SECONDS} segundos"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en carga masiva: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en carga masiva: {str(e)}"
        )