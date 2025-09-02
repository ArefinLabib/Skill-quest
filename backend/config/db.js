import mysql from 'mysql2';
// import dotenv from 'dotenv';

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "skillquest_db",
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
}).promise();

export default pool;