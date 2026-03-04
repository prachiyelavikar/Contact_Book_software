const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");

// Specific routes first to avoid conflict with /:id
router.get("/summary", contactController.getSummary);
router.get("/export/pdf", contactController.exportPDF);
router.get("/export/excel", contactController.exportExcel);

// General routes
router.get("/", contactController.getAllContacts);
router.post("/", contactController.addContact);
router.put("/:id", contactController.updateContact);
router.delete("/:id", contactController.deleteContact);
router.get('/:id', contactController.getContactById);

module.exports = router;