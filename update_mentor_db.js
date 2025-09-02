import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'skillquest_db'
};

async function updateDatabase() {
    let connection;
    
    try {
        console.log('🔄 Updating database for mentor functionality...');
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Add created_by column to projects table if it doesn't exist
        try {
            await connection.execute(`
                ALTER TABLE projects 
                ADD COLUMN created_by INT NULL,
                ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            `);
            console.log('✅ Added created_by column to projects table');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ created_by column already exists in projects table');
            } else {
                throw error;
            }
        }

        // Set the existing Portfolio project to be created by the first mentor user
        const [mentorUsers] = await connection.execute(
            "SELECT id FROM users WHERE role = 'mentor' LIMIT 1"
        );

        if (mentorUsers.length > 0) {
            await connection.execute(
                "UPDATE projects SET created_by = ? WHERE created_by IS NULL",
                [mentorUsers[0].id]
            );
            console.log('✅ Updated existing projects with mentor creator');
        }

        console.log('\n🎉 Mentor database updates completed!');
        console.log('   • Projects now have creator tracking');
        console.log('   • Mentor dashboard is ready');
        console.log('   • Role-based access control enabled');

    } catch (error) {
        console.error('❌ Error updating database:', error.message);
        if (error.code) console.error(`Error code: ${error.code}`);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateDatabase();
