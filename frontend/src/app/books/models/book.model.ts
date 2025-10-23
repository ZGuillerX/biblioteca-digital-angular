export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  category?: string;
  publication_year?: number;
  total_copies: number;
  available_copies: number;
  cover_url?: string;
  average_rating?: number;
  total_reviews?: number;
}