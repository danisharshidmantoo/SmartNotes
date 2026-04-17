const { validationResult } = require("express-validator");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Note = require("../models/Note");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @GET /api/notes
exports.getNotes = async (req, res, next) => {
  try {
    const { search, tag, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (search) {
      query.$text = { $search: search };
    }
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ isPinned: -1, updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Note.countDocuments(query),
    ]);

    res.json({
      notes,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/notes/:id
exports.getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }
    res.json({ note });
  } catch (error) {
    next(error);
  }
};

// @POST /api/notes
exports.createNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, content, tags, color, isPinned } = req.body;

    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      tags: tags || [],
      color: color || "default",
      isPinned: isPinned || false,
    });

    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/notes/:id
exports.updateNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    res.json({ note });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/notes/:id
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    res.json({ message: "Note deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// @POST /api/notes/:id/summarize
exports.summarizeNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a helpful assistant that creates concise, insightful summaries of notes. 
Summarize the key points clearly in 2-4 sentences. Be informative and direct.

Please summarize this note:

Title: ${note.title}

Content: ${note.content}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    note.summary = summary;
    await note.save();

    res.json({ summary, note });
  } catch (error) {
    console.error("Summarize error:", error);
    
    // Add this new block to handle the 503 error gracefully
    if (error?.status === 503) {
      return res.status(503).json({ error: "AI servers are currently overloaded. Please try summarizing again in a minute." });
    }
    
    if (error?.status === 429) {
      return res.status(429).json({ error: "Gemini rate limit reached. Please try again in a moment." });
    }
    if (error?.status === 400) {
      return res.status(400).json({ error: "Invalid Gemini API key. Please check your .env file." });
    }
    next(error);
  }
};


// @GET /api/notes/tags/all
exports.getAllTags = async (req, res, next) => {
  try {
    const tags = await Note.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);

    res.json({ tags: tags.map((t) => ({ name: t._id, count: t.count })) });
  } catch (error) {
    next(error);
  }
};
