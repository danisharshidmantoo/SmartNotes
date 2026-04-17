import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getNotes, deleteNote, summarizeNote, getAllTags } from "../services/api";
import NoteCard from "../components/NoteCard";
import NoteEditor from "../components/NoteEditor";
import { toast } from "../components/Toast";
import {
  Plus, Search, LogOut, Tag, Pin, StickyNote,
  ChevronDown, X, Loader, LayoutGrid, List
} from "lucide-react";

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // all | pinned
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [summarizingId, setSummarizingId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (activeTag) params.tag = activeTag;
      const { data } = await getNotes(params);
      let fetched = data.notes;
      if (activeFilter === "pinned") fetched = fetched.filter((n) => n.isPinned);
      setNotes(fetched);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, activeFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const { data } = await getAllTags();
      setTags(data.tags);
    } catch {}
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => { fetchTags(); }, [fetchTags]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchNotes(), 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const handleOpenEditor = (note = null) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleSaved = (savedNote, action) => {
    if (action === "create") {
      setNotes((prev) => [savedNote, ...prev]);
    } else {
      setNotes((prev) => prev.map((n) => (n._id === savedNote._id ? savedNote : n)));
    }
    fetchTags();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      fetchTags();
      toast.success("Note deleted.");
    } catch {
      toast.error("Failed to delete note.");
    }
  };

  const handleSummarize = async (note) => {
    setSummarizingId(note._id);
    try {
      const { data } = await summarizeNote(note._id);
      setNotes((prev) => prev.map((n) => (n._id === note._id ? data.note : n)));
      toast.success("Summary generated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Summarization failed.");
    } finally {
      setSummarizingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActiveTag("");
    setActiveFilter("all");
  };

  const hasFilters = search || activeTag || activeFilter !== "all";

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, ...(sidebarOpen ? {} : styles.sidebarCollapsed) }}>
        {/* Logo */}
        <div style={styles.sidebarLogo}>
          <span style={styles.logoIcon}>✦</span>
          {sidebarOpen && <span style={styles.logoText}>Noted</span>}
        </div>

        {/* New Note */}
        <button
          className="btn btn-primary"
          style={{ width: sidebarOpen ? "100%" : "auto", justifyContent: "center", padding: sidebarOpen ? "10px 20px" : "10px 12px" }}
          onClick={() => handleOpenEditor()}
        >
          <Plus size={16} />
          {sidebarOpen && "New Note"}
        </button>

        {sidebarOpen && (
          <>
            {/* Filters */}
            <nav style={styles.nav}>
              <p style={styles.navLabel}>Filter</p>
              {[
                { key: "all", label: "All Notes", icon: <StickyNote size={15} /> },
                { key: "pinned", label: "Pinned", icon: <Pin size={15} /> },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  style={{ ...styles.navItem, ...(activeFilter === key ? styles.navItemActive : {}) }}
                  onClick={() => setActiveFilter(key)}
                >
                  {icon} {label}
                  {key === "all" && <span style={styles.navBadge}>{pagination.total}</span>}
                </button>
              ))}
            </nav>

            {/* Tags */}
            {tags.length > 0 && (
              <nav style={styles.nav}>
                <p style={styles.navLabel}>Tags</p>
                <div style={styles.tagsList}>
                  {tags.slice(0, 12).map((t) => (
                    <button
                      key={t.name}
                      style={{ ...styles.tagItem, ...(activeTag === t.name ? styles.tagItemActive : {}) }}
                      onClick={() => setActiveTag(activeTag === t.name ? "" : t.name)}
                    >
                      <Tag size={11} /> {t.name}
                      <span style={styles.tagCount}>{t.count}</span>
                    </button>
                  ))}
                </div>
              </nav>
            )}
          </>
        )}

        {/* User + Logout */}
        <div style={styles.sidebarFooter}>
          {sidebarOpen && (
            <div style={styles.userInfo}>
              <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <p style={styles.userName}>{user?.name}</p>
                <p style={styles.userEmail}>{user?.email}</p>
              </div>
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={logoutUser}
            title="Sign out"
            style={{ padding: "8px 10px" }}
          >
            <LogOut size={15} />
            {sidebarOpen && "Sign out"}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          style={styles.collapseBtn}
          onClick={() => setSidebarOpen((s) => !s)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronDown
            size={14}
            style={{ transform: sidebarOpen ? "rotate(90deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}
          />
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Top bar */}
        <header style={styles.header}>
          <div style={styles.searchWrap}>
            <Search size={15} style={styles.searchIcon} />
            <input
              className="input"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            {search && (
              <button style={styles.clearSearch} onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={styles.headerRight}>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={13} /> Clear filters
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
              title="Toggle view"
            >
              {viewMode === "grid" ? <List size={15} /> : <LayoutGrid size={15} />}
            </button>
          </div>
        </header>

        {/* Section title */}
        <div style={styles.sectionHeader}>
          <h1 style={styles.sectionTitle}>
            {activeFilter === "pinned" ? "Pinned Notes" : activeTag ? `#${activeTag}` : search ? `Results for "${search}"` : "All Notes"}
          </h1>
          <span style={styles.countBadge}>{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Notes Grid / List */}
        {loading ? (
          <div style={styles.center}>
            <Loader size={28} color="var(--accent)" style={{ animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : notes.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>✦</span>
            <p style={styles.emptyTitle}>{hasFilters ? "No matching notes" : "No notes yet"}</p>
            <p style={styles.emptyText}>{hasFilters ? "Try clearing your filters." : "Create your first note to get started."}</p>
            {!hasFilters && (
              <button className="btn btn-primary" onClick={() => handleOpenEditor()} style={{ marginTop: 16 }}>
                <Plus size={15} /> New Note
              </button>
            )}
          </div>
        ) : (
          <div style={viewMode === "grid" ? styles.grid : styles.listView}>
            {notes.map((note) => (
              <div key={note._id} style={{ position: "relative" }}>
                {summarizingId === note._id && (
                  <div style={styles.summarizingOverlay}>
                    <Loader size={18} color="var(--accent)" style={{ animation: "spin 0.7s linear infinite" }} />
                    <span style={{ fontSize: 12, color: "var(--accent-light)" }}>Summarizing…</span>
                  </div>
                )}
                <NoteCard
                  note={note}
                  onEdit={handleOpenEditor}
                  onDelete={handleDelete}
                  onSummarize={handleSummarize}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Note Editor Modal */}
      {editorOpen && (
        <NoteEditor
          note={editingNote}
          onClose={() => { setEditorOpen(false); setEditingNote(null); }}
          onSaved={handleSaved}
          onToast={(msg, type) => toast[type]?.(msg)}
        />
      )}
    </div>
  );
}

const styles = {
  root: { display: "flex", height: "100vh", overflow: "hidden" },

  // Sidebar
  sidebar: { width: 240, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 20, padding: "20px 14px", transition: "width 0.2s", overflow: "hidden", position: "relative", flexShrink: 0 },
  sidebarCollapsed: { width: 62, padding: "20px 10px" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 8, paddingLeft: 4 },
  logoIcon: { fontSize: 22, color: "var(--accent)", flexShrink: 0 },
  logoText: { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, whiteSpace: "nowrap" },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navLabel: { fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, padding: "0 8px", marginBottom: 4 },
  navItem: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-body)", textAlign: "left", transition: "all 0.15s" },
  navItemActive: { background: "rgba(124,106,247,0.12)", color: "var(--accent-light)" },
  navBadge: { marginLeft: "auto", fontSize: 11, background: "var(--bg3)", color: "var(--text-dim)", padding: "1px 7px", borderRadius: 100 },
  tagsList: { display: "flex", flexDirection: "column", gap: 1 },
  tagItem: { display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-body)", textAlign: "left", transition: "all 0.15s" },
  tagItemActive: { background: "rgba(124,106,247,0.12)", color: "var(--accent-light)" },
  tagCount: { marginLeft: "auto", fontSize: 10, color: "var(--text-dim)" },
  sidebarFooter: { marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 },
  userInfo: { display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: "var(--radius-sm)", background: "var(--bg3)" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)", flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 },
  userEmail: { fontSize: 11, color: "var(--text-dim)", lineHeight: 1 },
  collapseBtn: { position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", zIndex: 10 },

  // Main
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", gap: 12, padding: "16px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  searchWrap: { flex: 1, position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 12, color: "var(--text-dim)", pointerEvents: "none" },
  searchInput: { paddingLeft: 36, paddingRight: 32 },
  clearSearch: { position: "absolute", right: 10, background: "transparent", border: "none", cursor: "pointer", color: "var(--text-dim)", display: "flex", alignItems: "center" },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  sectionHeader: { display: "flex", alignItems: "center", gap: 12, padding: "20px 24px 12px" },
  sectionTitle: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--text)" },
  countBadge: { fontSize: 12, color: "var(--text-dim)", background: "var(--bg3)", padding: "2px 10px", borderRadius: 100 },

  // Notes
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, padding: "0 24px 24px", overflowY: "auto", flex: 1, alignContent: "start" },
  listView: { display: "flex", flexDirection: "column", gap: 10, padding: "0 24px 24px", overflowY: "auto", flex: 1 },

  // States
  center: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 40 },
  emptyIcon: { fontSize: 40, color: "var(--text-dim)", marginBottom: 8 },
  emptyTitle: { fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-muted)" },
  emptyText: { fontSize: 14, color: "var(--text-dim)" },

  summarizingOverlay: { position: "absolute", inset: 0, background: "rgba(13,13,16,0.75)", backdropFilter: "blur(2px)", borderRadius: "var(--radius)", zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 },
};
