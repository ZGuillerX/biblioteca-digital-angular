CREATE DATABASE IF NOT EXISTS biblioteca_db;
USE biblioteca_db;

-- Tabla: users
-- Almacena información de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL COMMENT 'Nombre de usuario único',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT 'Email del usuario',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Contraseña encriptada',
    full_name VARCHAR(150) COMMENT 'Nombre completo',
    role ENUM('usuario', 'admin') DEFAULT 'usuario' COMMENT 'Rol del usuario',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Usuario activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabla: books
-- Almacena el catálogo de libros disponibles
CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT 'Título del libro',
    author VARCHAR(150) NOT NULL COMMENT 'Autor del libro',
    isbn VARCHAR(20) UNIQUE NOT NULL COMMENT 'ISBN único',
    description TEXT COMMENT 'Descripción del libro',
    category VARCHAR(100) COMMENT 'Categoría',
    publication_year INT COMMENT 'Año de publicación',
    total_copies INT NOT NULL DEFAULT 1 COMMENT 'Copias totales',
    available_copies INT NOT NULL DEFAULT 1 COMMENT 'Copias disponibles',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de registro',
    cover_url VARCHAR(255) DEFAULT NULL COMMENT 'URL de la portada del libro',
    pages JSON COMMENT 'Páginas del libro en formato JSON',
    total_pages INT DEFAULT 0 COMMENT 'Número total de páginas',
    average_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Valoración promedio del libro',
    total_reviews INT DEFAULT 0 COMMENT 'Número total de reseñas'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- Tabla: loans
-- Registra préstamos de libros
CREATE TABLE IF NOT EXISTS loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'ID del usuario',
    book_id INT NOT NULL COMMENT 'ID del libro',
    loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha del préstamo',
    due_date TIMESTAMP NOT NULL COMMENT 'Fecha de vencimiento',
    return_date TIMESTAMP NULL COMMENT 'Fecha de devolución',
    status ENUM('activo', 'devuelto', 'vencido') DEFAULT 'activo' COMMENT 'Estado del préstamo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
    has_review BOOLEAN DEFAULT FALSE COMMENT 'Indica si el usuario ha dejado una reseña para este préstamo',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tabla: reviews
-- Almacena las reseñas de los libros
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'ID del usuario que hizo la reseña',
    book_id INT NOT NULL COMMENT 'ID del libro reseñado',
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5) COMMENT 'Valoración del libro (1-5 estrellas)',
    comment TEXT COMMENT 'Comentario de la reseña',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la reseña',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, book_id) COMMENT 'Un usuario solo puede dejar una reseña por libro'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_book_isbn ON books(isbn);
CREATE INDEX idx_loan_status ON loans(status);
CREATE INDEX idx_loan_user ON loans(user_id);
CREATE INDEX idx_loan_book ON loans(book_id);
CREATE INDEX idx_books_rating ON books(average_rating DESC);
CREATE INDEX idx_reviews_book ON reviews(book_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Datos de prueba: Usuario admin
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
        'admin',
        'admin@biblioteca.com',
        '$2b$12$Vxtt96I1v0k.xUs4wNczFOn2RRH5EcRSM8up.DryNAoWi0xHHiHpa',
        'Administrador',
        'admin'
    );
-- Contraseña: admin123

-- Datos de prueba: Libros
INSERT INTO books (
        title,
        author,
        isbn,
        description,
        category,
        publication_year,
        total_copies,
        available_copies
    )
VALUES (
        'Cien Años de Soledad',
        'Gabriel García Márquez',
        '978-0060883287',
        'Obra maestra del realismo mágico',
        'Ficción',
        1967,
        3,
        3
    ),
    (
        '1984',
        'George Orwell',
        '978-0451524935',
        'Novela distópica clásica',
        'Ficción',
        1949,
        2,
        2
    ),
    (
        'El Principito',
        'Antoine de Saint-Exupéry',
        '978-0156012195',
        'Cuento filosófico',
        'Infantil',
        1943,
        5,
        5
    ),
    (
        'Don Quijote de la Mancha',
        'Miguel de Cervantes',
        '978-8424926441',
        'Clásico de la literatura española',
        'Clásico',
        1605,
        2,
        2
    );

-- Verificar datos insertados
SELECT 'Users creados:' as info;
SELECT * FROM users;
SELECT 'Libros creados:' as info;
SELECT * FROM books;

-- Crear procedimiento almacenado para actualizar las estadísticas del libro
DELIMITER //

CREATE PROCEDURE update_book_stats(IN book_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE total_reviews INT;

    -- Calcular el promedio de calificaciones
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, total_reviews
    FROM reviews
    WHERE book_id = book_id;

    -- Actualizar las estadísticas del libro
    UPDATE books
    SET average_rating = COALESCE(avg_rating, 0),
        total_reviews = total_reviews
    WHERE id = book_id;
END //

DELIMITER ;

-- Crear trigger para actualizar automáticamente las estadísticas del libro después de una nueva reseña
DELIMITER //

CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    CALL update_book_stats(NEW.book_id);
END //

DELIMITER ;

-- Crear trigger para actualizar automáticamente las estadísticas del libro después de actualizar una reseña
DELIMITER //

CREATE TRIGGER after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    CALL update_book_stats(NEW.book_id);
END //

DELIMITER ;

-- Crear trigger para actualizar automáticamente las estadísticas del libro después de eliminar una reseña
DELIMITER //

CREATE TRIGGER after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    CALL update_book_stats(OLD.book_id);
END //

DELIMITER ;
