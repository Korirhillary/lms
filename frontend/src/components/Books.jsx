import { useState, useEffect } from "react";
import "../styles/books.css";

const API = "http://127.0.0.1:5000";

const FALLBACK_COLORS = [
  "#2d5a27",
  "#1a1a2e",
  "#e65100",
  "#0288d1",
  "#4a1942",
  "#1a237e",
  "#bf360c",
  "#006064",
];

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ type: "", text: "" });
  const [form, setForm] = useState({
    title: "",
    author: "",
    stock: 1,
    image_url: "",
  });
  const [page, setPage] = useState(1);
  const perPage = 8;

  const fetchBooks = () => {
    setLoading(true);
    fetch(`${API}/books`)
      .then((r) => r.json())
      .then((data) => {
        setBooks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filtered = books.filter(
    (b) =>
      (b.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.author || "").toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // Stats
  const totalStock = books.reduce((s, b) => s + (b.stock ?? 0), 0);
  const outOfStock = books.filter((b) => (b.stock ?? 0) === 0).length;
  const lowStock = books.filter((b) => {
    const s = b.stock ?? 0;
    return s > 0 && s <= 5;
  }).length;

  const openAddModal = () => {
    setForm({ title: "", author: "", stock: 1, image_url: "" });
    setSaveMsg({ type: "", text: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSaveMsg({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          author: form.author.trim(),
          stock: Number(form.stock),
          image_url: form.image_url.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg({
          type: "success",
          text: data.message || "Book added successfully",
        });
        fetchBooks(); // refresh the list
        setTimeout(() => closeModal(), 1800);
      } else {
        setSaveMsg({
          type: "error",
          text:
            data.message ||
            data.error ||
            "Failed to add book. Please try again.",
        });
      }
    } catch {
      setSaveMsg({
        type: "error",
        text: "Network error. Make sure the server is running.",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="books-page">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-heading">Books</h1>
          <p className="page-sub">Manage your library book collection</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" onClick={fetchBooks}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: 14, height: 14 }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: 14, height: 14 }}
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Book
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="books-stats">
        <div className="card bk-stat-card">
          <div className="bk-stat-icon" style={{ background: "#3b82f6" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <p className="bk-stat-num">{books.length}</p>
            <p className="bk-stat-label">Total Titles</p>
          </div>
        </div>
        <div className="card bk-stat-card">
          <div className="bk-stat-icon" style={{ background: "#22c55e" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div>
            <p className="bk-stat-num">{totalStock}</p>
            <p className="bk-stat-label">Total Stock</p>
          </div>
        </div>
        <div className="card bk-stat-card">
          <div className="bk-stat-icon" style={{ background: "#f59e0b" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="bk-stat-num">{lowStock}</p>
            <p className="bk-stat-label">Low Stock (≤5)</p>
          </div>
        </div>
        <div className="card bk-stat-card">
          <div className="bk-stat-icon" style={{ background: "#ef4444" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <p className="bk-stat-num">{outOfStock}</p>
            <p className="bk-stat-label">Out of Stock</p>
          </div>
        </div>
      </div>

      {/* ── Table card ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {/* Controls */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div className="search-box" style={{ maxWidth: 320 }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder="Search by title or author…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <span className="total-count">
            {filtered.length} book{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cover</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Stock</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((b, i) => {
                      const stock = b.stock ?? 0;
                      const stockLevel =
                        stock === 0 ? "out" : stock <= 5 ? "low" : "ok";
                      return (
                        <tr key={b.id}>
                          <td>
                            <code className="id-code">#{b.id}</code>
                          </td>

                          {/* Cover thumbnail */}
                          <td>
                            {b.image_url ? (
                              <img
                                src={b.image_url}
                                alt={b.title}
                                style={{
                                  width: 36,
                                  height: 50,
                                  objectFit: "cover",
                                  borderRadius: 5,
                                  display: "block",
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                width: 36,
                                height: 50,
                                borderRadius: 5,
                                background:
                                  FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                                display: b.image_url ? "none" : "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.55rem",
                                color: "#fff",
                                textAlign: "center",
                                padding: 3,
                                lineHeight: 1.3,
                                fontWeight: 700,
                              }}
                            >
                              {b.title?.split(" ").slice(0, 3).join(" ")}
                            </div>
                          </td>

                          {/* Title */}
                          <td>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                lineHeight: 1.3,
                              }}
                            >
                              {b.title || "—"}
                            </p>
                          </td>

                          {/* Author */}
                          <td
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {b.author || "—"}
                          </td>

                          {/* Stock number */}
                          <td>
                            <span className={`stock-num ${stockLevel}`}>
                              {stock}
                            </span>
                          </td>

                          {/* Availability badge */}
                          <td>
                            {stock === 0 ? (
                              <span className="avail-pill out">
                                Out of Stock
                              </span>
                            ) : stock <= 5 ? (
                              <span className="avail-pill low">Low Stock</span>
                            ) : (
                              <span className="avail-pill ok">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        No books found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ padding: "14px 20px" }}>
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ width: 11, height: 11 }}
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`page-btn ${page === i + 1 ? "active" : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ width: 11, height: 11 }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add New Book Modal ───────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal book-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-wrap">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ width: 20, height: 20 }}
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <line x1="12" y1="7" x2="12" y2="13" />
                    <line x1="9" y1="10" x2="15" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3>Add New Book</h3>
                  <p className="modal-subtitle">
                    Fill in the book details to add it to the collection
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Title */}
              <div className="form-group">
                <label>
                  Title <span className="req">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. The Great Gatsby"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Author */}
              <div className="form-group">
                <label>
                  Author <span className="req">*</span>
                </label>
                <input
                  required
                  placeholder="e.g. F. Scott Fitzgerald"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>

              {/* Stock */}
              <div className="form-group">
                <label>
                  Stock <span className="req">*</span>
                </label>
                <div className="days-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setForm({
                        ...form,
                        stock: Math.max(0, Number(form.stock) - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    className="stepper-input"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stock: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setForm({ ...form, stock: Number(form.stock) + 1 })
                    }
                  >
                    +
                  </button>
                </div>
                <p className="field-hint">
                  Number of copies available in the library
                </p>
              </div>

              {/* Image URL */}
              <div className="form-group">
                <label>
                  Cover Image URL{" "}
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    (optional)
                  </span>
                </label>
                <input
                  placeholder="https://example.com/cover.jpg"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm({ ...form, image_url: e.target.value })
                  }
                />
                {/* Live preview */}
                {form.image_url && (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <img
                      src={form.image_url}
                      alt="preview"
                      style={{
                        width: 44,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 5,
                        border: "1px solid var(--border)",
                      }}
                      onError={(e) => (e.target.style.opacity = "0.3")}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cover preview
                    </span>
                  </div>
                )}
              </div>

              {/* Success / Error message */}
              {saveMsg.text && (
                <div className={`modal-alert ${saveMsg.type}`}>
                  {saveMsg.type === "success" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ width: 16, height: 16, flexShrink: 0 }}
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ width: 16, height: 16, flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  {saveMsg.text}
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={saveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <>
                      <span className="btn-spinner" /> Adding...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: 14, height: 14 }}
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Book
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}