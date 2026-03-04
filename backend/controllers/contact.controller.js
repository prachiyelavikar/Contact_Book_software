const db = require("../db/config");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Get all non-deleted contact_book
exports.getAllContacts = (req, res) => {
    db.query("SELECT * FROM contact_book WHERE is_deleted = FALSE ORDER BY name ASC", (err, result) => {
        if (err) {
            console.error("Error fetching contacts:", err);
            return res.status(500).json({ message: "Error fetching contacts", error: err.message });
        }
        res.json(result);
    });
};

// Add new contact
exports.addContact = (req, res) => {
    const { name, mobile, email } = req.body;

    const checkQuery = "SELECT * FROM contact_book WHERE (mobile = ? OR email = ?) AND is_deleted = FALSE";
    db.query(checkQuery, [mobile, email], (err, results) => {
        if (err) return res.status(500).json(err);

        if (results.length > 0) {
            const existing = results[0];
            const field = existing.mobile === mobile ? "Mobile number" : "Email";
            return res.status(400).json({ message: `${field} आधीच अस्तित्वात आहे!` });
        }

        db.query(
            "INSERT INTO contact_book (name, mobile, email) VALUES (?, ?, ?)",
            [name, mobile, email],
            (err, result) => {
                if (err) return res.status(500).json(err);

                db.query("SELECT * FROM contact_book WHERE is_deleted = FALSE ORDER BY name ASC", (err2, result2) => {
                    if (err2) return res.status(500).json(err2);
                    res.json(result2);
                });
            }
        );
    });
};

// Get contact by ID
exports.getContactById = (req, res) => {
    const { id } = req.params;
    db.query(
        "SELECT * FROM contact_book WHERE id = ? AND is_deleted = FALSE", [id],
        (err, result) => {
            if (err) {
                console.error("Error fetching contact by ID:", err);
                return res.status(500).json({ message: "Error fetching contact", error: err.message });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Contact not found" });
            }

            res.json(result[0]);
        }
    );
};

// Update contact
exports.updateContact = (req, res) => {
    const { id } = req.params;
    const { name, mobile, email } = req.body;

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

                db.query("SELECT * FROM contact_book WHERE is_deleted = FALSE ORDER BY name ASC", (err2, result2) => {
                    if (err2) return res.status(500).json(err2);
                    res.json(result2);
                });
            }
        );
    });
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

// Get Summary Statistics
exports.getSummary = (req, res) => {
    db.query("SELECT COUNT(*) as totalContacts FROM contact_book WHERE is_deleted = FALSE", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
};

// Export to PDF
exports.exportPDF = (req, res) => {
    db.query("SELECT name, mobile, email, created_at FROM contact_book WHERE is_deleted = FALSE ORDER BY name ASC", (err, results) => {
        if (err) return res.status(500).send("Error generating PDF");

        const doc = new PDFDocument();
        let filename = "contacts.pdf";
        res.setHeader("Content-disposition", 'attachment; filename="' + filename + '"');
        res.setHeader("Content-type", "application/pdf");

        doc.fontSize(20).text("Contact Book Summary", { align: "center" });
        doc.moveDown();

        results.forEach((contact, index) => {
            const date = typeof contact.created_at === 'string' ? contact.created_at : new Date(contact.created_at).toLocaleDateString('en-GB');
            doc.fontSize(12).text(`${index + 1}. ${contact.name}`);
            doc.fontSize(10).text(`   Mobile: ${contact.mobile}`);
            doc.fontSize(10).text(`   Email: ${contact.email}`);
            doc.fontSize(10).text(`   Date: ${date}`);
            doc.moveDown();
        });

        doc.pipe(res);
        doc.end();
    });
};

// Export to Excel
exports.exportExcel = (req, res) => {
    db.query("SELECT name, mobile, email, created_at FROM contact_book WHERE is_deleted = FALSE ORDER BY name ASC", async (err, results) => {
        if (err) return res.status(500).send("Error generating Excel");

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Contacts");

        worksheet.columns = [
            { header: "Sr. No", key: "srno", width: 10 },
            { header: "Name", key: "name", width: 30 },
            { header: "Mobile", key: "mobile", width: 20 },
            { header: "Email", key: "email", width: 30 },
            { header: "Date", key: "date", width: 20 },
        ];

        results.forEach((contact, index) => {
            const date = typeof contact.created_at === 'string' ? contact.created_at : new Date(contact.created_at).toLocaleDateString('en-GB');
            worksheet.addRow({
                srno: index + 1,
                name: contact.name,
                mobile: contact.mobile,
                email: contact.email,
                date: date,
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=contacts.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    });
};
