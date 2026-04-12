-- Add featured boolean column to projects table
ALTER TABLE projects ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false;

-- Mark the top 3 projects by priority as featured
UPDATE projects SET featured = true WHERE priority <= 3;
