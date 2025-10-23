"""
Módulo de Rutas
===============
Exporta todos los routers de la aplicación.
"""

from . import auth, books, loans, reviews, bulk_upload

__all__ = ['auth', 'books', 'loans', 'reviews', 'bulk_upload']
