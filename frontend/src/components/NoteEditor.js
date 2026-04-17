import React, { useState, useEffect } from "react";
import { createNote, updateNote, summarizeNote } from "../services/api";
import { X, Sparkles, Pin, PinOff, Tag, Loader } from "lucide-react";

const COLORS = ["default", "red", "orange", "yellow", "green", "blue", "purple"];
const COLOR_DOTS = {
  default: "#4a4959", red: "#f05e5e", orange: "#f5943b",
  yellow: "#f5c842", green: "#4fd68a", blue: "#4fb8f5", purple: "#7c6af7",
};

export default function NoteEditor({ note, onClose, onSaved, onToast }) {
  const isEdit = !!note?._id;
  const [form, setForm] = useState({
    title: note?.title || "",
    content: note?.content || "",
    color: note?.color || "default",
    isPinned: note?.isPinned || false,
    tags: note?.tags?.join(", ") || "",
  });
  const [summary, setSummary] = useState(note?.summary || "");
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.content.trim()) { setError("Content is required."); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        color: form.color,
        isPinned: form.isPinned,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      const fn = isEdit ? () => updateNote(note._id, payload) : () => createNote(payload);
      const { data } = await fn();
      onSaved(data.note, isEdit ? "update" : "create");
      onToast(isEdit ? "Note updated." : "Note created!", "success");
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  const handleSummarize = async () => {
    if (!isEdit) { onToast("Save the note first before summarizing.", "info"); return; }
    setSummarizing(true);
    try {
      const { data } = await summarizeNote(note._id);
      setSummary(data.summary);
      onToast("Summary generated!", "success");
    } catch (err) {
      onToast(err.response?.data?.error || "Summarization failed.", "error");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        className="fade-in"
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          width: "100%",
          maxWidth: "1000px",
          height: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 32px 100px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 28px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {isEdit ? "Edit Note" : "New Note"}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setForm((f) => ({ ...f, isPinned: !f.isPinned }))}
            >
              {form.isPinned
                ? <Pin size={15} color="var(--accent)" />
                : <PinOff size={15} />}
              {form.isPinned ? "Pinned" : "Pin"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              style={{ padding: "6px 10px" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Color Picker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 28px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-dim)", marginRight: 4 }}>
            Color:
          </span>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setForm((f) => ({ ...f, color: c }))}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: COLOR_DOTS[c],
                border: "none",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                transform: form.color === c ? "scale(1.4)" : "scale(1)",
                boxShadow: form.color === c ? `0 0 10px ${COLOR_DOTS[c]}` : "none",
              }}
              title={c}
            />
          ))}
        </div>

        {/* Body - scrollable */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "24px 28px",
            overflowY: "auto",
          }}
        >
          {/* Title */}
          <input
            className="input"
            name="title"
            placeholder="Note title…"
            value={form.title}
            onChange={handleChange}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 22,
              padding: "14px 18px",
              flexShrink: 0,
            }}
          />

          {/* Content - takes up remaining space */}
          <textarea
            className="input"
            name="content"
            placeholder="Write your thoughts here…"
            value={form.content}
            onChange={handleChange}
            style={{
              flex: 1,
              minHeight: "420px",
              fontSize: 16,
              lineHeight: "1.9",
              padding: "16px 18px",
              resize: "vertical",
            }}
          />

          {/* Tags */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <Tag size={15} color="var(--text-dim)" style={{ flexShrink: 0 }} />
            <input
              className="input"
              name="tags"
              placeholder="Tags (comma separated: work, ideas, todo)"
              value={form.tags}
              onChange={handleChange}
              style={{ padding: "10px 14px", fontSize: 14 }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(240,94,94,0.1)",
                border: "1px solid rgba(240,94,94,0.2)",
                color: "var(--red)",
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {error}
            </div>
          )}

          {/* AI Summary */}
          {summary && (
            <div
              style={{
                background: "rgba(124,106,247,0.08)",
                border: "1px solid rgba(124,106,247,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "16px 20px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} color="var(--accent)" />
                <span
                  style={{
                    color: "var(--accent-light)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  AI Summary
                </span>
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 15,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {summary}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 28px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleSummarize}
            disabled={summarizing || !isEdit}
            title={!isEdit ? "Save note first" : "Summarize with AI"}
          >
            {summarizing
              ? <Loader size={14} style={{ animation: "spin 0.7s linear infinite" }} />
              : <Sparkles size={14} />}
            {summarizing ? "Summarizing…" : "AI Summarize"}
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                : isEdit ? "Update Note" : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}