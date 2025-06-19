const mysql = require("mysql2");

const db = mysql.createConnection({
    host: 'bwy6yoycfxtbdpkpb7ez-mysql.services.clever-cloud.com',
    user: 'uqp9iojapouitq8g',
    password: 'jVHsia3oVOkwFDdMVjIU',
    database: 'bwy6yoycfxtbdpkpb7ez'
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

module.exports = db;
