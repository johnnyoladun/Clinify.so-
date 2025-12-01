-- Reactivate admin user account
-- This will set your admin account back to 'active' status

UPDATE users 
SET status = 'active',
    updated_at = NOW()
WHERE role = 'admin';

-- If you know your specific email, you can use this instead:
-- UPDATE users 
-- SET status = 'active',
--     updated_at = NOW()
-- WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, full_name, role, status 
FROM users 
WHERE role = 'admin';
