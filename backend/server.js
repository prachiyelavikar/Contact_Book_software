const express = require("express");
const cors = require("cors");
require("dotenv").config(); // .env वाचण्यासाठी

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Cross-origin allow करतो
app.use(express.json()); // JSON body parsing

// Routes
const contactRoutes = require("./routes/contact.routes");
app.use("/api/contacts", contactRoutes);

// Test route (optional)
app.get("/", (req, res) => {
    res.send("✅ Contact Book Backend is Live!");
});

app.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}`);
});
