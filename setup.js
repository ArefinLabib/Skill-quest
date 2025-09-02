import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    console.log('🚀 Setting up SkillQuest database...');
    
    let connection;
    
    try {
        // Connect to MySQL without specifying database
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute('CREATE DATABASE IF NOT EXISTS skillquest_db');
        console.log('✅ Database created/verified');

        // Use the database
        await connection.execute('USE skillquest_db');

        // Read and execute schema
        const schemaPath = path.join(__dirname, 'backend', 'config', 'db.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                } catch (error) {
                    // Ignore errors for statements that might already exist
                    if (!error.message.includes('already exists')) {
                        console.warn('⚠️  Warning:', error.message);
                    }
                }
            }
        }
        console.log('✅ Database schema created');

        // Read and execute sample data
        const sampleDataPath = path.join(__dirname, 'backend', 'config', 'roadmap_sample_data.sql');
        const sampleData = fs.readFileSync(sampleDataPath, 'utf8');
        
        const dataStatements = sampleData.split(';').filter(stmt => stmt.trim());
        
        for (const statement of dataStatements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                } catch (error) {
                    // Ignore errors for duplicate data
                    if (!error.message.includes('Duplicate entry')) {
                        console.warn('⚠️  Warning:', error.message);
                    }
                }
            }
        }
        console.log('✅ Sample data inserted');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📋 Sample accounts:');
        console.log('   Student: john@example.com / password123');
        console.log('   Mentor:  jane@example.com / password123');
        console.log('   Student: bob@example.com / password123');
        console.log('   Mentor:  alice@example.com / password123');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
        console.log('\n💡 Make sure MySQL is running and the credentials are correct in backend/config/db.js');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupDatabase();
}

export { setupDatabase };
