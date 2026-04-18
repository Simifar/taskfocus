-- Add project features to categories table
ALTER TABLE categories 
ADD COLUMN description TEXT,
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_id TEXT,
ADD COLUMN position INTEGER DEFAULT 0;

-- Add foreign key constraint for parent_id
ALTER TABLE categories 
ADD CONSTRAINT categories_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS categories_user_id_is_archived_idx ON categories(user_id, is_archived);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);

-- Update existing categories to have position based on creation order
UPDATE categories SET position = (
  SELECT COUNT(*) - 1 
  FROM categories c2 
  WHERE c2.user_id = categories.user_id 
  AND c2.created_at <= categories.created_at
) 
WHERE position = 0;
