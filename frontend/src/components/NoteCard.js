import React from "react";
import { Pin, Sparkles, Trash2, Edit3 } from "lucide-react";

export default function NoteCard({ note, onEdit, onDelete, onSummarize }) {
  const preview = note.content.length > 160 ? note.content.slice(0, 160) + "…" : note.content;
  const colorClass = note.color && note.color !== "default" ? `note-color-${note.color}` : "";

  return (
    <div
      className={`card ${colorClass}`}
      style={styles.card}
      onClick={() => onEdit(note)}
    >
      {/* Top row */}
      <div style={styles.top}>
        <h3 style={styles.title}>{note.title}</h3>
        {note.isPinned && <Pin size={13} color="var(--accent)" style={{ flexShrink: 0 }} />}
      </div>

      {/* Preview */}
      <p style={styles.preview}>{preview}</p>

      {/* Summary badge */}
      {note.summary && (
        <div style={styles.summaryBadge}>
          <Sparkles size={11} color="var(--accent)" />
          <span style={{ fontSize: 11, color: "var(--accent-light)" }}>Summarized</span>
        </div>
      )}

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div style={styles.tags}>
          {note.tags.slice(0, 3).map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
          {note.tags.length > 3 && <span style={{ fontSize: 11, color: "var(--text-dim)" }}>+{note.tags.length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.date}>{new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <div style={styles.actions} onClick={(e) => e.stopPropagation()}>
          <button
            style={styles.actionBtn}
            onClick={() => onSummarize(note)}
            title="Summarize"
          >
            <Sparkles size={14} />
          </button>
          <button
            style={styles.actionBtn}
            onClick={() => onEdit(note)}
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            style={{ ...styles.actionBtn, ...styles.deleteBtn }}
            onClick={() => onDelete(note._id)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { padding: 18, cursor: "pointer", transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s", display: "flex", flexDirection: "column", gap: 10 },
  top: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  title: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--text)", lineHeight: 1.3 },
  preview: { fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, flex: 1 },
  summaryBadge: { display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(124,106,247,0.08)", border: "1px solid rgba(124,106,247,0.15)", borderRadius: 100, padding: "2px 8px" },
  tags: { display: "flex", flexWrap: "wrap", gap: 4 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  date: { fontSize: 11, color: "var(--text-dim)" },
  actions: { display: "flex", gap: 4 },
  actionBtn: { background: "transparent", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 5, borderRadius: 6, display: "flex", alignItems: "center", transition: "color 0.15s, background 0.15s" },
  deleteBtn: { color: "var(--red)" },
};
