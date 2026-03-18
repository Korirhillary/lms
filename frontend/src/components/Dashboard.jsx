import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const API = "http://127.0.0.1:5000";

const FALLBACK_COVERS = [
  { color: "#2d5a27", textColor: "#c8e6c9" },
  { color: "#1a1a2e", textColor: "#e0e0ff" },
  { color: "#e65100", textColor: "#fff3e0" },
  { color: "#0288d1", textColor: "#e1f5fe" },
  { color: "#4a1942", textColor: "#f8bbd9" },
  { color: "#1a237e", textColor: "#e8eaf6" },
];

const avatarColors = [
  "#e8415a",
  "#7c4dff",
  "#00bcd4",
  "#ff9800",
  "#4caf50",
  "#e91e63",
  "#2196f3",
  "#ff5722",
];
function getAvatarColor(str) {
  let h = 0;
  for (let c of str || "") h = c.charCodeAt(0) + ((h << 5) - h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Format date string to readable short format
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Return badge class based on status from backend
function getStatusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "overdue":
      return "status-overdue";
    case "returned late":
      return "status-returned-late";
    case "returned":
      return "status-returned";
    default:
      return "status-neutral"; // "-"
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [overdues, setOverdues] = useState([]);
  const [issuing, setIssuing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [overduePage, setOverduePage] = useState(1);
  const overduePerPage = 5;

  // Issue Book modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    email: "",
    book_name: "",
    days: 1,
  });
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [issueSuccess, setIssueSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/members`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API}/books`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API}/overdues`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API}/issuing`)
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([m, b, o, t]) => {
      setMembers(Array.isArray(m) ? m : []);
      setBooks(Array.isArray(b) ? b : []);
      setOverdues(Array.isArray(o) ? o : []);
      setIssuing(Array.isArray(t) ? t : []);
      setLoading(false);
    });
  }, []);

  // ── Issue Book handler ────────────────────────────────────────
  const openIssueModal = () => {
    setIssueForm({ email: "", book_name: "", days: 1 });
    setIssueError("");
    setIssueSuccess("");
    setShowIssueModal(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueLoading(true);
    setIssueError("");
    setIssueSuccess("");
    try {
      const res = await fetch(`${API}/issuing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: issueForm.email,
          book_name: issueForm.book_name,
          days: Number(issueForm.days),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIssueError(
          data.message || "Failed to issue book. Please try again."
        );
      } else {
        setIssueSuccess(`Book issued successfully! Issue ID: ${data.issue_id}`);
        // Refresh issuing and books after issuing
        const [newIss, newBooks] = await Promise.all([
          fetch(`${API}/issuing`)
            .then((r) => r.json())
            .catch(() => []),
          fetch(`${API}/books`)
            .then((r) => r.json())
            .catch(() => []),
        ]);
        setIssuing(Array.isArray(newIss) ? newIss : []);
        setBooks(Array.isArray(newBooks) ? newBooks : []);
        // Auto-close after 2 seconds
        setTimeout(() => setShowIssueModal(false), 2000);
      }
    } catch (err) {
      setIssueError("Network error. Make sure the server is running.");
    } finally {
      setIssueLoading(false);
    }
  };

  // Count only truly overdue (not returned)
  const activeOverdueCount = overdues.filter(
    (o) => o.status === "Overdue"
  ).length;

  const stats = [
    {
      label: "Total Members",
      value: members.length || 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Borrowed Books",
      value: issuing.filter((r) => r.is_cleared === false).length || 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      label: "Overdue Books",
      value: activeOverdueCount || 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Total Books",
      value: books.length || 0,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="12" y1="7" x2="12" y2="13" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      ),
    },
  ];

  const chartData = [
    { day: "SAT", visitors: 280, borrowers: 180 },
    { day: "SUN", visitors: 320, borrowers: 210 },
    { day: "MON", visitors: 450, borrowers: 300 },
    { day: "TUE", visitors: 380, borrowers: 260 },
    { day: "WED", visitors: 500, borrowers: 350 },
    { day: "THU", visitors: 420, borrowers: 290 },
    { day: "FRI", visitors: 360, borrowers: 240 },
  ];
  const maxVal = 500;

  // Only show Overdue or Returned late — exclude on-time returns
  const filteredOverdues = overdues.filter(
    (o) => o.status === "Overdue" || o.status === "Returned late"
  );

  // Paginated overdues
  const totalOverduePages = Math.ceil(filteredOverdues.length / overduePerPage);
  const paginatedOverdues = filteredOverdues.slice(
    (overduePage - 1) * overduePerPage,
    overduePage * overduePerPage
  );

  // Active borrowers — books currently out (is_cleared = false)
  const activeBorrowers = issuing.filter((r) => r.is_cleared === false);

  if (loading)
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );

  return (
    <div className="dashboard">
      {/* Greeting */}
      <div className="dash-greeting">
        <div className="greeting-left">
          <div className="greeting-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className="greeting-text">
              Hello, <span className="accent-name">Hillary!</span>
            </h1>
            <p className="greeting-date">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
              ,{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="time-filter">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-content">
              <p className="stat-value">{s.value.toLocaleString()}</p>
              <p className="stat-label">{s.label}</p>
            </div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="tables-row">
        {/* Members List */}
        <div className="card table-card">
          <div className="section-header">
            <h2 className="section-title">Members List</h2>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {members.length} total
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Debt (Kes)</th>
                </tr>
              </thead>
              <tbody>
                {members.slice(0, 5).map((m) => (
                  <tr key={m.id}>
                    <td>
                      <code className="id-code">#{m.id}</code>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div
                          className="user-avatar-sm"
                          style={{ background: getAvatarColor(m.name || "") }}
                        >
                          {getInitials(m.name || "")}
                        </div>
                        <div>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {m.name || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {m.email || "—"}
                    </td>
                    <td>
                      {(m.outstanding_debt || 0) > 0 ? (
                        <span className="debt-badge">
                          Kes {m.outstanding_debt.toLocaleString()}
                        </span>
                      ) : (
                        <span className="cleared-zero">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No members yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="see-all-row">
            <button
              className="see-all-btn"
              onClick={() => navigate("/members")}
            >
              See All Members
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: 13, height: 13 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Books List */}
        <div className="card table-card">
          <div className="section-header">
            <h2 className="section-title">Books List</h2>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {books.length} total
            </span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {books.slice(0, 5).map((b, i) => {
                  const stock = b.stock ?? b.available ?? 0;
                  return (
                    <tr key={b.id}>
                      <td>
                        {b.image_url ? (
                          <img
                            src={b.image_url}
                            alt={b.title}
                            style={{
                              width: 28,
                              height: 38,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        ) : (
                          <div
                            style={{
                              width: 28,
                              height: 38,
                              borderRadius: 4,
                              background:
                                FALLBACK_COVERS[i % FALLBACK_COVERS.length]
                                  .color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.55rem",
                              color: "#fff",
                              textAlign: "center",
                              padding: 2,
                              lineHeight: 1.2,
                            }}
                          >
                            {b.title?.slice(0, 8)}
                          </div>
                        )}
                      </td>
                      <td>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            lineHeight: 1.2,
                          }}
                        >
                          {b.title || "—"}
                        </p>
                        <p
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          #{b.id}
                        </p>
                      </td>
                      <td
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {b.author || "—"}
                      </td>
                      <td>
                        <span
                          className={`avail-badge ${
                            stock > 20 ? "high" : stock > 5 ? "med" : "low"
                          }`}
                        >
                          {stock}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {books.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No books yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="see-all-row">
            <button className="see-all-btn" onClick={() => navigate("/books")}>
              See All Books
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: 13, height: 13 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Top Choices */}
      <div className="top-choices-section">
        <h2 className="section-title" style={{ marginBottom: 14 }}>
          Top Choices
        </h2>
        <div className="books-carousel">
          {books.slice(0, 6).map((book, i) => {
            const fb = FALLBACK_COVERS[i % FALLBACK_COVERS.length];
            return (
              <div key={i} className="book-card">
                {book.image_url ? (
                  <img
                    src={book.image_url}
                    alt={book.title}
                    className="book-cover-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling)
                        e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="book-cover"
                  style={{
                    background: fb.color,
                    color: fb.textColor,
                    display: book.image_url ? "none" : "flex",
                  }}
                >
                  <p className="cover-title">
                    {(book.title || "").split(" ").slice(0, 5).join(" ")}
                  </p>
                  {book.author && <p className="cover-author">{book.author}</p>}
                </div>
                <p className="book-name-small">{book.title}</p>
                <p className="book-author-small">{book.author || ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── OVERDUE BOOK LIST ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ padding: "16px 16px 0" }}>
          <h2 className="section-title">Overdue Book List</h2>
          <div className="overdue-summary">
            <span className="overdue-pill active">
              {activeOverdueCount} Active
            </span>
            <span className="overdue-pill total">
              {filteredOverdues.length} Total
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>Book</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Returned</th>
                <th>Overdue Days</th>
                <th>Status</th>
                <th>Fine (Kes)</th>
              </tr>
            </thead>
            <tbody>
              {filteredOverdues.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    No overdue records found
                  </td>
                </tr>
              ) : (
                paginatedOverdues.map((o, i) => (
                  <tr
                    key={o.id || i}
                    className={o.status === "Overdue" ? "row-overdue" : ""}
                  >
                    {/* ID */}
                    <td>
                      <code className="id-code">#{o.id}</code>
                    </td>

                    {/* Member */}
                    <td>
                      <div className="user-cell">
                        <div
                          className="user-avatar-sm"
                          style={{
                            background: getAvatarColor(o.member_name || ""),
                          }}
                        >
                          {getInitials(o.member_name || "")}
                        </div>
                        <div>
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: "0.82rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {o.member_name || "—"}
                          </p>
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            ID: {o.member_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Book */}
                    <td>
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            lineHeight: 1.2,
                          }}
                        >
                          {o.book_title || "—"}
                        </p>
                        <p
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {o.book_author || ""}
                        </p>
                      </div>
                    </td>

                    {/* Issued At */}
                    <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {formatDate(o.issued_at)}
                    </td>

                    {/* Expected Return */}
                    <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      <span
                        className={
                          o.status === "Overdue" ? "due-date-overdue" : ""
                        }
                      >
                        {formatDate(o.expected_return_date)}
                      </span>
                    </td>

                    {/* Actual Return */}
                    <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {o.actual_return_date ? (
                        formatDate(o.actual_return_date)
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          Not returned
                        </span>
                      )}
                    </td>

                    {/* Overdue Days — live from backend */}
                    <td>
                      {o.overdue_days > 0 ? (
                        <span className="overdue-days-badge">
                          {o.overdue_days} day{o.overdue_days !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>

                    {/* Status — live from backend */}
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(o.status)}`}
                      >
                        {o.status || "—"}
                      </span>
                    </td>

                    {/* Fine */}
                    <td>
                      {o.fine > 0 ? (
                        <span className="fine-amount">
                          Kes {o.fine.toLocaleString()}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.8rem",
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalOverduePages > 1 && (
          <div className="pagination" style={{ padding: "12px 16px" }}>
            <button
              className="page-btn"
              onClick={() => setOverduePage((p) => Math.max(1, p - 1))}
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
            {Array.from({ length: totalOverduePages }, (_, i) => (
              <button
                key={i + 1}
                className={`page-btn ${overduePage === i + 1 ? "active" : ""}`}
                onClick={() => setOverduePage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() =>
                setOverduePage((p) => Math.min(totalOverduePages, p + 1))
              }
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
      </div>
      {/* ── END OVERDUE ───────────────────────────────────────────────── */}

      {/* Bottom Row */}
      <div className="bottom-row">
        {/* Active Borrowers */}
        <div className="card issued-card">
          <div className="section-header" style={{ padding: "16px 16px 0" }}>
            <h2 className="section-title">Active Borrowers</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="active-borrowers-count">
                {activeBorrowers.length} out
              </span>
              <button
                className="btn btn-primary"
                onClick={openIssueModal}
                style={{ fontSize: "0.78rem", padding: "6px 12px" }}
              >
                Issue Book
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book</th>
                  <th>Issued</th>
                  <th>Due Date</th>
                  <th>Charge</th>
                </tr>
              </thead>
              <tbody>
                {activeBorrowers.slice(0, 5).map((r, i) => {
                  const txBook = books.find((b) => b.id === r.book_id) || null;
                  const isPastDue = new Date(r.return_date) < new Date();
                  return (
                    <tr key={r.id || i}>
                      {/* Member */}
                      <td>
                        <div className="user-cell">
                          <div
                            className="user-avatar-sm"
                            style={{
                              background: getAvatarColor(r.member_name || ""),
                            }}
                          >
                            {getInitials(r.member_name || "")}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                lineHeight: 1.2,
                              }}
                            >
                              {r.member_name || "—"}
                            </p>
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {r.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Book */}
                      <td>
                        <div className="user-cell">
                          {txBook?.image_url ? (
                            <img
                              src={txBook.image_url}
                              alt={r.book_name}
                              className="mini-book-cover"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <div
                              className="mini-book-cover-fallback"
                              style={{
                                background:
                                  FALLBACK_COVERS[i % FALLBACK_COVERS.length]
                                    .color,
                              }}
                            />
                          )}
                          <div>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                lineHeight: 1.2,
                              }}
                            >
                              {r.book_name || "—"}
                            </p>
                            <p
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              ID #{r.book_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Issued */}
                      <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {formatDate(r.issue_date)}
                      </td>
                      {/* Due Date */}
                      <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        <span className={isPastDue ? "due-date-overdue" : ""}>
                          {formatDate(r.return_date)}
                        </span>
                      </td>
                      {/* Charge */}
                      <td>
                        <span className="charge-badge-sm">
                          Kes {(r.charge || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {activeBorrowers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No active borrowers right now 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* See All → /borrowers */}
          <div className="see-all-row" style={{ padding: "10px 16px" }}>
            <button
              className="see-all-btn"
              onClick={() => navigate("/borrowers")}
            >
              See All Borrowers
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: 13, height: 13 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Chart */}
        <div className="card chart-card">
          <div className="section-header" style={{ padding: "16px 20px 0" }}>
            <h2 className="section-title">Visitors & Borrowers Statistics</h2>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {chartData.map((d, i) => (
                <div key={i} className="bar-group">
                  <div className="bars">
                    <div
                      className="bar bar-visitors"
                      style={{ height: `${(d.visitors / maxVal) * 100}%` }}
                      title={`Visitors: ${d.visitors}`}
                    />
                    <div
                      className="bar bar-borrowers"
                      style={{ height: `${(d.borrowers / maxVal) * 100}%` }}
                      title={`Borrowers: ${d.borrowers}`}
                    />
                  </div>
                  <span className="bar-label">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot visitors-dot" />
                Visitors
              </span>
              <span className="legend-item">
                <span className="legend-dot borrowers-dot" />
                Borrowers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ISSUE BOOK MODAL */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div
            className="modal issue-modal"
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
                  <h3>Issue a Book</h3>
                  <p className="modal-subtitle">
                    Fill in the details to loan a book to a member
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowIssueModal(false)}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleIssueSubmit} className="modal-form">
              {/* Email dropdown */}
              <div className="form-group">
                <label>
                  Member Email <span className="req">*</span>
                </label>
                <div className="select-wrap">
                  <select
                    required
                    value={issueForm.email}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, email: e.target.value })
                    }
                  >
                    <option value="">— Select a member —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.email}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="select-arrow"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Book name dropdown */}
              <div className="form-group">
                <label>
                  Book <span className="req">*</span>
                </label>
                <div className="select-wrap">
                  <select
                    required
                    value={issueForm.book_name}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, book_name: e.target.value })
                    }
                  >
                    <option value="">— Select a book —</option>
                    {books
                      .filter((b) => (b.stock ?? b.available ?? 0) > 0)
                      .map((b) => (
                        <option key={b.id} value={b.title}>
                          {b.title} — {b.author} (Stock:{" "}
                          {b.stock ?? b.available ?? 0})
                        </option>
                      ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="select-arrow"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Days stepper */}
              <div className="form-group">
                <label>
                  Loan Period (days) <span className="req">*</span>
                </label>
                <div className="days-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setIssueForm({
                        ...issueForm,
                        days: Math.max(1, issueForm.days - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={issueForm.days}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        days: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="stepper-input"
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() =>
                      setIssueForm({ ...issueForm, days: issueForm.days + 1 })
                    }
                  >
                    +
                  </button>
                </div>
                <p className="field-hint">
                  Charge: <strong>Kes {issueForm.days * 100}</strong> (Kes 100 /
                  day)
                </p>
              </div>

              {/* Error / Success messages */}
              {issueError && (
                <div className="modal-alert error">
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
                  {issueError}
                </div>
              )}
              {issueSuccess && (
                <div className="modal-alert success">
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
                  {issueSuccess}
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowIssueModal(false)}
                  disabled={issueLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={issueLoading}
                >
                  {issueLoading ? (
                    <>
                      <span className="btn-spinner" /> Issuing...
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
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      Issue Book
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
