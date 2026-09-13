-- Categorías predeterminadas globales o para nuevos usuarios
INSERT INTO categorias (nombre, color, icono)
VALUES 
    ('Alimentación', '#10B981', 'Utensils'),
    ('Transporte', '#3B82F6', 'Car'),
    ('Vivienda', '#8B5CF6', 'Home'),
    ('Entretenimiento', '#EC4899', 'Film'),
    ('Salud', '#EF4444', 'Activity'),
    ('Servicios', '#F59E0B', 'Zap'),
    ('Educación', '#06B6D4', 'BookOpen'),
    ('Otros', '#6B7280', 'MoreHorizontal')
ON CONFLICT DO NOTHING;
