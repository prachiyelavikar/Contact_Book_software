const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");

router.get("/", contactController.getAllContacts);
router.post("/", contactController.addContact);
router.put("/:id", contactController.updateContact);
router.delete("/:id", contactController.deleteContact);
router.get('/:id', contactController.getContactById);

module.exports = router;