const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [50000, "Content cannot exceed 50,000 characters"],
    },
    summary: {
      type: String,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 30,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "default",
      enum: ["default", "red", "orange", "yellow", "green", "blue", "purple"],
    },
  },
  { timestamps: true }
);

// Text index for search
noteSchema.index({ title: "text", content: "text", tags: "text" });

module.exports = mongoose.model("Note", noteSchema);
