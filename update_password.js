import pool from './backend/config/db.js';
import bcrypt from 'bcrypt';

async function updatePassword() {
    try {
        console.log('Updating password for existing user...\n');
        
        const email = 'arefinlabib14@gmail.com';
        const newPassword = 'password123';
        const newHash = await bcrypt.hash(newPassword, 10);
        
        console.log('Email:', email);
        console.log('New password:', newPassword);
        console.log('New hash:', newHash);
        
        // Update the password hash
        const [result] = await pool.execute(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [newHash, email]
        );
        
        console.log('Update result:', result);
        console.log('Password updated successfully!');
        
        // Verify the update
        const [user] = await pool.execute(
            'SELECT id, name, email, role, password_hash FROM users WHERE email = ?',
            [email]
        );
        
        console.log('Updated user:', user[0]);
        
        // Test the new password
        const isValid = await bcrypt.compare(newPassword, user[0].password_hash);
        console.log('New password verification:', isValid);
        
    } catch (error) {
        console.error('Error updating password:', error);
    } finally {
        await pool.end();
    }
}

updatePassword();
