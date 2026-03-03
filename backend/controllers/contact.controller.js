const db = require("../db/config");

// Get all non-deleted contact_book
exports.getAllContacts = (req, res) => {
    db.query("SELECT * FROM contact_book WHERE is_deleted = FALSE", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};


// Add new contact
// exports.addContact = (req, res) => {
//     const { name, mobile, email } = req.body;
//     db.query(
//         "INSERT INTO contact_book (name, mobile, email) VALUES (?, ?, ?)", [name, mobile, email],
//         (err, result) => {
//             if (err) return res.status(500).json(err);
//             res.json({ message: "Contact added" });
//         }
//     );
// };

exports.addContact = (req, res) => {
    const { name, mobile, email } = req.body;

    // युनिक डेटा चेक: मोबाईल किंवा ईमेल आधीच आहे का ते तपासा (Start of New logic)
    const checkQuery = "SELECT * FROM contact_book WHERE (mobile = ? OR email = ?) AND is_deleted = FALSE";
    db.query(checkQuery, [mobile, email], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length > 0) {
            // जर डुप्लिकेट असेल तर एरर मेसेज पाठवा
            const existing = results[0];
            const field = existing.mobile === mobile ? "Mobile number" : "Email";
            return res.status(400).json({ message: `${field} आधीच अस्तित्वात आहे!` });
        }

        // जर युनिक असेल तर इन्सर्ट करा
        db.query(
            "INSERT INTO contact_book (name, mobile, email) VALUES (?, ?, ?)",
            [name, mobile, email],
            (err, result) => {
                if (err) return res.status(500).json(err);

                // New contact insert झाल्यावर सर्व contacts परत पाठव
                db.query("SELECT * FROM contact_book WHERE is_deleted = FALSE", (err2, result2) => {
                    if (err2) return res.status(500).json(err2);
                    res.json(result2);
                });
            }
        );
    });
    // (End of New logic)
};



// Get contact by ID
exports.getContactById = (req, res) => {
    const { id } = req.params;
    db.query(
        "SELECT * FROM contact_book WHERE id = ? AND is_deleted = FALSE", [id],
        (err, result) => {
            if (err) return res.status(500).json(err);

            if (result.length === 0) {
                return res.status(404).json({ message: "Contact not found" });
            }

            res.json(result[0]); // एकच contact object परत
        }
    );
};


// Update contact
// exports.updateContact = (req, res) => {
//     const { id } = req.params;
//     const { name, mobile, email } = req.body;
//     db.query(
//         "UPDATE contact_book SET name=?, mobile=?, email=? WHERE id=?", [name, mobile, email, id],
//         (err, result) => {
//             if (err) return res.status(500).json(err);
//             res.json({ message: "Contact updated" });
//         }
//     );
// };

exports.updateContact = (req, res) => {
    const { id } = req.params;
    const { name, mobile, email } = req.body;

    // अपडेट करताना युनिक चेक: स्वतःचा आयडी सोडून इतरांचा मोबाईल/ईमेल मॅच होतोय का पहा (Start of New logic)
    const checkQuery = "SELECT * FROM contact_book WHERE (mobile = ? OR email = ?) AND id != ? AND is_deleted = FALSE";
    db.query(checkQuery, [mobile, email, id], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length > 0) {
            const existing = results[0];
            const field = existing.mobile === mobile ? "Mobile number" : "Email";
            return res.status(400).json({ message: `${field} दुसऱ्या कॉन्टॅक्टसाठी आधीच वापरला आहे!` });
        }

        db.query(
            "UPDATE contact_book SET name=?, mobile=?, email=? WHERE id=?",
            [name, mobile, email, id],
            (err, result) => {
                if (err) return res.status(500).json(err);

                db.query("SELECT * FROM contact_book WHERE is_deleted = FALSE", (err2, result2) => {
                    if (err2) return res.status(500).json(err2);
                    res.json(result2); // ✅ updated list
                });
            }
        );
    });
    // (End of New logic)
};




// Soft delete contact
exports.deleteContact = (req, res) => {
    const { id } = req.params;
    db.query(
        "UPDATE contact_book SET is_deleted = TRUE WHERE id=?", [id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Contact soft-deleted" });
        }
    );
};
