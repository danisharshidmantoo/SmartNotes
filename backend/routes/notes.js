const express = require("express");
const { body } = require("express-validator");
const {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  summarizeNote,
  getAllTags,
} = require("../controllers/notesController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All note routes require authentication
router.use(protect);

const noteValidation = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }).withMessage("Title too long"),
  body("content").trim().notEmpty().withMessage("Content is required"),
];

router.get("/tags/all", getAllTags);

router.route("/").get(getNotes).post(noteValidation, createNote);

router.route("/:id").get(getNote).put(updateNote).delete(deleteNote);

router.post("/:id/summarize", summarizeNote);

module.exports = router;
