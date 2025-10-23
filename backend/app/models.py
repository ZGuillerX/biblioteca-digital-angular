"""
Módulo de Modelos Pydantic
===========================
Define los esquemas de validación de datos para requests y responses.
Utiliza Pydantic para validación automática.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal, List
from datetime import datetime
import re


# ==================== MODELOS DE USUARIO ====================

# Modelo base de usuario con campos comunes.
class UserBase(BaseModel):
  
    username: str = Field(..., min_length=3, max_length=100, description="Nombre de usuario único")
    email: EmailStr = Field(..., description="Email válido del usuario")
    full_name: Optional[str] = Field(None, max_length=150, description="Nombre completo")
    
    # Valida que el username solo contenga letras, números y guiones bajos.
    @validator('username')
    def username_alphanumeric(cls, v):
       
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('El username solo puede contener letras, números y guiones bajos')
        return v


#  Modelo para crear un nuevo usuario.
#  Incluye contraseña encriptada
class UserCreate(UserBase):
    
    password: str = Field(..., min_length=6, description="Contraseña (mínimo 6 caracteres)")
    role: Literal['usuario', 'admin'] = Field(default='usuario', description="Rol del usuario")
    
    # Valida que la contraseña tenga al menos una letra y un número.
    @validator('password')
    def password_strength(cls, v):
        
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('La contraseña debe contener al menos una letra y un número')
        return v

# Modelo para login de usuario.
class UserLogin(BaseModel):
    
    username: str = Field(..., description="Nombre de usuario")
    password: str = Field(..., description="Contraseña")


# Modelo de respuesta de usuario (sin contraseña).
class UserResponse(UserBase):
   
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Modelo para actualizar datos de usuario.
# Todos los campos son opcionales.
class UserUpdate(BaseModel):
    
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


# ==================== MODELOS DE AUTENTICACIÓN ====================

#  Modelo de respuesta de token JWT
class Token(BaseModel):
   
    access_token: str = Field(..., description="Token JWT")
    token_type: str = Field(default="bearer", description="Tipo de token")


#  Modelo de datos contenidos en el token.
class TokenData(BaseModel):
    
    username: Optional[str] = None
    role: Optional[str] = None


# ==================== MODELOS DE LIBRO ====================

# Modelo base de libro.
class BookBase(BaseModel):
    
    title: str = Field(..., min_length=1, max_length=255, description="Título del libro")
    author: str = Field(..., min_length=1, max_length=150, description="Autor del libro")
    isbn: str = Field(..., min_length=10, max_length=20, description="ISBN del libro")
    google_books_id: Optional[str] = Field(None, max_length=50, description="ID de Google Books (volumeId)")
    description: Optional[str] = Field(None, description="Descripción del libro")
    category: Optional[str] = Field(None, max_length=100, description="Categoría")
    publication_year: Optional[int] = Field(None, ge=1000, le=2100, description="Año de publicación")
    cover_url: Optional[str] = None
    total_pages: Optional[int] = Field(None, ge=0, description="Número total de páginas")

    # Valida formato básico de ISBN (solo números y guiones)
    @validator('isbn')
    def validate_isbn(cls, v):
        isbn_clean = v.replace('-', '').replace(' ', '').upper()

        # Verifica longitud
        if len(isbn_clean) == 10:
            # ISBN-10: puede terminar en X
            if not re.match(r'^\d{9}[\dX]$', isbn_clean):
                raise ValueError('ISBN-10 debe tener 9 dígitos y un dígito o X final')
            
            # Validar checksum ISBN-10
            total = sum((10 - i) * (10 if x == 'X' else int(x)) for i, x in enumerate(isbn_clean))
            if total % 11 != 0:
                raise ValueError('ISBN-10 inválido (checksum incorrecto)')
        
        elif len(isbn_clean) == 13:
            if not isbn_clean.isdigit():
                raise ValueError('ISBN-13 debe contener solo dígitos')
            
            # Validar checksum ISBN-13
            total = sum((int(x) * (1 if i % 2 == 0 else 3)) for i, x in enumerate(isbn_clean[:-1]))
            check_digit = (10 - (total % 10)) % 10
            if check_digit != int(isbn_clean[-1]):
                raise ValueError('ISBN-13 inválido (checksum incorrecto)')
        
        else:
            raise ValueError('ISBN debe tener 10 o 13 caracteres válidos')
        
        return isbn_clean



#Modelo para crear un nuevo libro.
class BookCreate(BookBase):
    total_copies: int = Field(default=1, ge=1, description="Número total de copias")
    available_copies: int = Field(default=1, ge=0, description="Copias disponibles")
    
    # Valida que las copias disponibles no excedan el total.
    @validator('available_copies')
    def validate_available_copies(cls, v, values):
        
        if 'total_copies' in values and v > values['total_copies']:
            raise ValueError('Las copias disponibles no pueden exceder el total')
        return v

#  Modelo para actualizar un libro.
#  todos los campos son opcionales.
class BookUpdate(BaseModel):
    
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    publication_year: Optional[int] = Field(None, ge=1000, le=2100)
    total_copies: Optional[int] = Field(None, ge=1)
    available_copies: Optional[int] = Field(None, ge=0)

# Modelo de respuesta de libro.
class BookResponse(BookBase):
    id: int
    total_copies: int
    available_copies: int
    created_at: datetime
    average_rating: float = Field(0.0, ge=0.0, le=5.0, description="Valoración promedio del libro")
    total_reviews: int = Field(0, ge=0, description="Número total de reseñas")
    
    class Config:
        from_attributes = True

class BookPage(BaseModel):
    """Modelo para una página individual del libro"""
    number: int = Field(..., ge=1, description="Número de página")
    content: str = Field(..., description="Contenido de la página")

class BookPagesResponse(BaseModel):
    """Modelo para respuesta de páginas del libro"""
    book_id: int
    book_title: str
    google_books_id: Optional[str] = Field(None, description="ID de Google Books para visor embebido")
    total_pages: int
    pages: List[BookPage]
    is_preview: bool = Field(default=False, description="Indica si es vista previa")
    has_loan: bool = Field(default=False, description="Indica si el usuario tiene el libro prestado")


# ==================== MODELOS DE PRÉSTAMO ====================

# Modelo para crear un nuevo préstamo.
class LoanCreate(BaseModel):
   
    book_id: int = Field(..., gt=0, description="ID del libro a prestar")

# Modelo de respuesta de préstamo.
class LoanResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    loan_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    status: str
    created_at: datetime
    has_review: bool = Field(False, description="Indica si el usuario ha dejado una reseña para este préstamo")
    
    class Config:
        from_attributes = True


# Modelo de préstamo con detalles del libro
class LoanWithDetails(LoanResponse):
    
    book_title: str
    book_author: str
    user_username: str


# ==================== MODELOS DE RESEÑA ====================

class ReviewBase(BaseModel):
    book_id: int = Field(..., gt=0, description="ID del libro reseñado")
    rating: int = Field(..., ge=1, le=5, description="Valoración del libro (1-5 estrellas)")
    comment: Optional[str] = Field(None, max_length=1000, description="Comentario de la reseña")
    
class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== MODELOS DE RESPUESTA GENÉRICOS ====================

#Modelo de respuesta genérica con mensaje
class MessageResponse(BaseModel):

    message: str = Field(..., description="Mensaje de respuesta")
    detail: Optional[str] = Field(None, description="Detalle adicional")


#Modelo de respuesta de error
class ErrorResponse(BaseModel):
    
    error: str = Field(..., description="Tipo de error")
    message: str = Field(..., description="Mensaje de error")
    detail: Optional[str] = Field(None, description="Detalle técnico")

