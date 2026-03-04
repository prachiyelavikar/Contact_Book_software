const mysql = require("mysql2");
require("dotenv").config();

// Create a connection pool instead of a single connection
// This helps handle connection timeouts and reconnections automatically
const db = mysql.createPool({
    host: process.env.DB_HOST || 'bwy6yoycfxtbdpkpb7ez-mysql.services.clever-cloud.com',
    user: process.env.DB_USER || 'uqp9iojapouitq8g',
    password: process.env.DB_PASSWORD || 'jVHsia3oVOkwFDdMVjIU',
    database: process.env.DB_NAME || 'bwy6yoycfxtbdpkpb7ez',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Log pool creation
console.log("✅ MySQL Pool Created");

module.exports = db;
