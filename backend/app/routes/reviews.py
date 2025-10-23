from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import ReviewCreate, ReviewResponse, UserResponse
from database import execute_query
from routes.auth import get_current_user

router = APIRouter(tags=["reviews"])

def get_user_id(current_user):
    """Obtiene el ID del usuario basado en el username"""
    if not current_user:
        return None
    
    username = current_user.get('username')
    if not username:
        return None
    
    # Buscar el ID del usuario en la base de datos usando el username
    try:
        user = execute_query(
            "SELECT id FROM users WHERE username = %s",
            (username,)
        )
        if user and user[0]:
            return user[0]['id']
    except Exception as e:
        print(f"Error al buscar ID del usuario: {e}")
    
    return None

def get_user_role(current_user):
    """Obtiene el rol del usuario"""
    return current_user.get('role') or current_user.get('user_role') or 'usuario'

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(review: ReviewCreate, current_user: UserResponse = Depends(get_current_user)):
    user_id = get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=400, detail="No se pudo identificar al usuario")

    # Verificar si el usuario ya ha hecho una reseña para este libro
    existing_review = execute_query(
        "SELECT id FROM reviews WHERE user_id = %s AND book_id = %s",
        (user_id, review.book_id)
    )
    if existing_review:
        raise HTTPException(status_code=400, detail="Ya has hecho una reseña para este libro")

    # Verificar si el usuario ha tomado prestado este libro y lo ha devuelto
    loan = execute_query(
        """SELECT id, has_review FROM loans 
           WHERE user_id = %s AND book_id = %s AND status = 'devuelto'
           ORDER BY return_date DESC LIMIT 1""",
        (user_id, review.book_id)
    )
    
    if not loan:
        raise HTTPException(
            status_code=400, 
            detail="Debes haber tomado prestado y devuelto el libro para hacer una reseña"
        )
    
    # Verificar si ya se hizo reseña para este préstamo
    if loan[0].get('has_review', False):
        raise HTTPException(
            status_code=400, 
            detail="Ya has creado una reseña para este préstamo"
        )

    # Crear la reseña (sin RETURNING * que no funciona en MySQL)
    execute_query(
        "INSERT INTO reviews (user_id, book_id, rating, comment) VALUES (%s, %s, %s, %s)",
        (user_id, review.book_id, review.rating, review.comment),
        fetch=False
    )

    # Obtener el ID de la reseña recién creada
    new_review = execute_query(
        "SELECT * FROM reviews WHERE user_id = %s AND book_id = %s ORDER BY id DESC LIMIT 1",
        (user_id, review.book_id)
    )

    # Actualizar el préstamo para indicar que se ha dejado una reseña
    execute_query(
        "UPDATE loans SET has_review = TRUE WHERE id = %s",
        (loan[0]['id'],),
        fetch=False
    )

    return ReviewResponse(**new_review[0])

@router.get("/book/{book_id}", response_model=List[ReviewResponse])
async def get_book_reviews(book_id: int):
    reviews = execute_query(
        "SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.book_id = %s ORDER BY r.created_at DESC",
        (book_id,)
    )
    return [ReviewResponse(**review) for review in reviews]

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(user_id: int, current_user: UserResponse = Depends(get_current_user)):
    current_user_id = get_user_id(current_user)
    user_role = get_user_role(current_user)
    
    if current_user_id != user_id and user_role != 'admin':
        raise HTTPException(status_code=403, detail="No tienes permiso para ver las reseñas de otros usuarios")
    
    reviews = execute_query(
        "SELECT r.*, b.title as book_title FROM reviews r JOIN books b ON r.book_id = b.id WHERE r.user_id = %s ORDER BY r.created_at DESC",
        (user_id,)
    )
    return [ReviewResponse(**review) for review in reviews]

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(review_id: int, current_user: UserResponse = Depends(get_current_user)):
    review = execute_query("SELECT * FROM reviews WHERE id = %s", (review_id,))
    if not review:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    
    current_user_id = get_user_id(current_user)
    user_role = get_user_role(current_user)
    
    if review[0]['user_id'] != current_user_id and user_role != 'admin':
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta reseña")
    
    execute_query("DELETE FROM reviews WHERE id = %s", (review_id,), fetch=False)
    return None