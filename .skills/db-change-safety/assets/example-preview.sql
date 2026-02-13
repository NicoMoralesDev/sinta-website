-- Example safe update pattern (DO NOT RUN on prod without explicit approval)

BEGIN;

-- Preview
SELECT COUNT(*)
FROM some_table
WHERE some_condition = true;

-- Update (scoped)
UPDATE some_table
SET some_column = 'new_value'
WHERE some_condition = true;

-- Post-check
SELECT COUNT(*)
FROM some_table
WHERE some_condition = true
  AND some_column = 'new_value';

-- Rollback by default in examples
ROLLBACK;
