import { useState, useEffect } from "react";
import "../styles/borrowers.css";

const API = "http://127.0.0.1:5000";

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
function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Find the matching overdue record for an issuing row
// Matches on member_id + book_id where actual_return_date is null (still out)
// or the most recent overdue entry for that combo
function findOverdue(overduesAll, issuingRow) {
  // Prefer unresolved (actual_return_date = null) match first
  const open = overduesAll.find(
    (o) =>
      o.member_id === issuingRow.member_id &&
      o.book_id === issuingRow.book_id &&
      o.actual_return_date === null
  );
  if (open) return open;
  // Fall back to any match (for cleared records)
  return (
    overduesAll.find(
      (o) =>
        o.member_id === issuingRow.member_id && o.book_id === issuingRow.book_id
    ) || null
  );
}

// TotalFee badge component — charge + fine
function TotalFeeBadge({ charge = 0, fine = 0 }) {
  const total = charge + fine;
  const hasFine = fine > 0;
  return (
    <div className="total-fee-cell">
      <span className={`total-fee-badge ${hasFine ? "has-fine" : ""}`}>
        Kes {total.toLocaleString()}
      </span>
      {hasFine && (
        <div className="fee-breakdown">
          <span>Rental: Kes {charge.toLocaleString()}</span>
          <span className="fee-fine">+ Fine: Kes {fine.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

const TABS = [
  {
    key: "active",
    label: "Currently Issued",
    desc: "Books currently out — is_cleared: false",
    cols: 9,
  },
  {
    key: "overdue",
    label: "Overdue Books",
    desc: "Books past their due date with outstanding fines",
    cols: 10,
  },
  {
    key: "all",
    label: "All Issuing Records",
    desc: "Complete borrowing history — every record from /issuing",
    cols: 9,
  },
];

export default function Borrowers() {
  const [issuingAll, setIssuingAll] = useState([]);
  const [overduesAll, setOverduesAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [returningId, setReturningId] = useState(null);

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/issuing`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API}/overdues`)
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([iss, ovd]) => {
      setIssuingAll(Array.isArray(iss) ? iss : []);
      setOverduesAll(Array.isArray(ovd) ? ovd : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Return Book ────────────────────────────────────────────────
  const returnBook = async (record) => {
    setReturningId(record.id);
    setMessage({ type: "", text: "" });
    try {
      const res = await fetch(`${API}/issuing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: record.email || "",
          book_name: record.book_name || "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text:
            data.message ||
            "Book returned successfully and transaction recorded",
        });
        fetchAll();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({
          type: "error",
          text: data.message || data.error || "Failed to return book",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setReturningId(null);
    }
  };

  // ── Three datasets ─────────────────────────────────────────────
  const activeIssued = issuingAll.filter((r) => r.is_cleared === false);
  const overdueBooks = overduesAll.filter((r) => r.status === "Overdue");
  const allIssuing = issuingAll;

  // ── Summary stats ──────────────────────────────────────────────
  const totalFines = overduesAll
    .filter((r) => r.status === "Overdue" || r.status === "Returned late")
    .reduce((sum, r) => sum + (r.fine || 0), 0);

  // Total revenue = all charges + all fines
  const totalRevenue =
    issuingAll.reduce((sum, r) => sum + (r.charge || 0), 0) + totalFines;

  const dataMap = {
    active: activeIssued,
    overdue: overdueBooks,
    all: allIssuing,
  };
  const currentData = dataMap[activeTab] || [];

  const filtered = currentData.filter((r) => {
    const q = search.toLowerCase();
    const name = (r.member_name || "").toLowerCase();
    const book = (r.book_name || r.book_title || "").toLowerCase();
    const mid = String(r.member_id || "");
    return name.includes(q) || book.includes(q) || mid.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const switchTab = (key) => {
    setActiveTab(key);
    setPage(1);
    setSearch("");
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="borrowers-page">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-heading">Borrowers</h1>
          <p className="page-sub">
            Track currently issued, overdue, and all borrowing history
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchAll}>
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
      </div>

      {/* ── Message Banner ────────────────────────────────────── */}
      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.type === "success" ? (
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
          {message.text}
        </div>
      )}

      {/* ── Summary Cards ─────────────────────────────────────── */}
      <div className="borrower-stats">
        <div
          className="card bstat-card"
          onClick={() => switchTab("active")}
          style={{
            cursor: "pointer",
            outline:
              activeTab === "active" ? "2px solid var(--accent)" : "none",
          }}
        >
          <div className="bstat-icon" style={{ background: "#3b82f6" }}>
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
            <p className="bstat-num">{activeIssued.length}</p>
            <p className="bstat-label">Currently Out</p>
          </div>
        </div>

        <div
          className="card bstat-card"
          onClick={() => switchTab("overdue")}
          style={{
            cursor: "pointer",
            outline:
              activeTab === "overdue" ? "2px solid var(--accent)" : "none",
          }}
        >
          <div className="bstat-icon" style={{ background: "#ef4444" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="bstat-num">{overdueBooks.length}</p>
            <p className="bstat-label">Overdue</p>
          </div>
        </div>

        <div className="card bstat-card">
          <div className="bstat-icon" style={{ background: "#f59e0b" }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className="bstat-num">Kes {totalFines.toLocaleString()}</p>
            <p className="bstat-label">Outstanding Fines</p>
          </div>
        </div>

        <div
          className="card bstat-card"
          onClick={() => switchTab("all")}
          style={{
            cursor: "pointer",
            outline: activeTab === "all" ? "2px solid var(--accent)" : "none",
          }}
        >
          <div className="bstat-icon" style={{ background: "#22c55e" }}>
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
            <p className="bstat-num">{allIssuing.length}</p>
            <p className="bstat-label">Total Records</p>
          </div>
        </div>
      </div>

      {/* ── Table card ────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {/* Tab bar */}
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => switchTab(t.key)}
            >
              {t.label}
              <span className="tab-count">{dataMap[t.key].length}</span>
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div
          style={{
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginBottom: 12,
            }}
          >
            {TABS.find((t) => t.key === activeTab)?.desc}
          </p>
          <div className="table-controls">
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
                placeholder="Search name, book…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <span className="total-count">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* ══ TAB: CURRENTLY ISSUED ══════════════════════════
                Source: /issuing | filter: is_cleared === false
                Total Fee = charge (from /issuing)
                          + fine (matched from /overdues by member_id+book_id)
            ═══════════════════════════════════════════════════════ */}
            {activeTab === "active" && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Issue #</th>
                      <th>Member</th>
                      <th>Book</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Loan Days</th>
                      <th>Rental (Kes)</th>
                      <th>Total Fee</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length > 0 ? (
                      paginated.map((r) => {
                        const issueD = new Date(r.issue_date);
                        const dueD = new Date(r.return_date);
                        const loanDays =
                          !isNaN(issueD) && !isNaN(dueD)
                            ? Math.round(
                                (dueD - issueD) / (1000 * 60 * 60 * 24)
                              )
                            : "—";
                        const isPastDue = dueD < new Date();
                        const overdue = findOverdue(overduesAll, r);
                        const fine = overdue?.fine || 0;
                        return (
                          <tr key={r.id}>
                            <td>
                              <code className="id-code">#{r.id}</code>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div
                                  className="user-avatar-sm"
                                  style={{
                                    background: getAvatarColor(
                                      r.member_name || ""
                                    ),
                                  }}
                                >
                                  {getInitials(r.member_name || "")}
                                </div>
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 700,
                                      fontSize: "0.82rem",
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
                                    ID: {r.member_id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="user-cell">
                                {r.image_url ? (
                                  <img
                                    src={r.image_url}
                                    alt={r.book_name}
                                    style={{
                                      width: 28,
                                      height: 38,
                                      objectFit: "cover",
                                      borderRadius: 4,
                                      flexShrink: 0,
                                    }}
                                    onError={(e) =>
                                      (e.target.style.display = "none")
                                    }
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 28,
                                      height: 38,
                                      borderRadius: 4,
                                      background: "var(--bg-input)",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "0.82rem",
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
                                    Book ID: {r.book_id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDateTime(r.issue_date)}
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                className={isPastDue ? "due-date-overdue" : ""}
                              >
                                {formatDateTime(r.return_date)}
                              </span>
                            </td>
                            <td
                              style={{ fontSize: "0.82rem", fontWeight: 600 }}
                            >
                              {loanDays}
                              {typeof loanDays === "number" ? " day(s)" : ""}
                            </td>
                            <td>
                              <span className="charge-badge">
                                Kes {(r.charge || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* ── TOTAL FEE: rental charge + any accrued fine ── */}
                            <td>
                              <TotalFeeBadge
                                charge={r.charge || 0}
                                fine={fine}
                              />
                            </td>

                            <td>
                              <span
                                className={`status-badge ${
                                  isPastDue ? "status-overdue" : "status-active"
                                }`}
                              >
                                {isPastDue ? "Overdue" : "Active"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="return-btn"
                                onClick={() => returnBook(r)}
                                disabled={returningId === r.id}
                              >
                                {returningId === r.id ? (
                                  <>
                                    <span className="spinner-small" />
                                    Returning...
                                  </>
                                ) : (
                                  "Return Book"
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="empty-state">
                          No books currently issued 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ TAB: OVERDUE BOOKS ══════════════════════════════
                Source: /overdues | filter: status === "Overdue"
                Total Fee = charge (matched from /issuing)
                          + fine (from /overdues — live calculated)
            ═══════════════════════════════════════════════════════ */}
            {activeTab === "overdue" && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Record #</th>
                      <th>Member</th>
                      <th>Book</th>
                      <th>Author</th>
                      <th>Issued On</th>
                      <th>Due Date</th>
                      <th>Actual Return</th>
                      <th>Overdue Days</th>
                      <th>Rental (Kes)</th>
                      <th>Fine (Kes)</th>
                      <th>Total Fee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length > 0 ? (
                      paginated.map((r) => {
                        // Find the matching issuing record to get the rental charge
                        const issuingRecord =
                          issuingAll.find(
                            (iss) =>
                              iss.member_id === r.member_id &&
                              iss.book_id === r.book_id &&
                              iss.is_cleared === false
                          ) ||
                          issuingAll.find(
                            (iss) =>
                              iss.member_id === r.member_id &&
                              iss.book_id === r.book_id
                          );
                        const charge = issuingRecord?.charge || 0;
                        return (
                          <tr key={r.id} className="row-overdue">
                            <td>
                              <code className="id-code">#{r.id}</code>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div
                                  className="user-avatar-sm"
                                  style={{
                                    background: getAvatarColor(
                                      r.member_name || ""
                                    ),
                                  }}
                                >
                                  {getInitials(r.member_name || "")}
                                </div>
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 700,
                                      fontSize: "0.82rem",
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
                                    ID: {r.member_id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <p
                                style={{ fontWeight: 600, fontSize: "0.82rem" }}
                              >
                                {r.book_title || "—"}
                              </p>
                              <p
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                ID: {r.book_id}
                              </p>
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {r.book_author || "—"}
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDateTime(r.issued_at)}
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span className="due-date-overdue">
                                {formatDate(r.expected_return_date)}
                              </span>
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.actual_return_date ? (
                                formatDate(r.actual_return_date)
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>
                                  Not returned
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="overdue-days-badge">
                                {r.overdue_days} day
                                {r.overdue_days !== 1 ? "s" : ""}
                              </span>
                            </td>
                            {/* Rental charge */}
                            <td>
                              {charge > 0 ? (
                                <span className="charge-badge">
                                  Kes {charge.toLocaleString()}
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>
                                  —
                                </span>
                              )}
                            </td>
                            {/* Fine */}
                            <td>
                              {r.fine > 0 ? (
                                <span className="fine-amount">
                                  Kes {r.fine.toLocaleString()}
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>
                                  —
                                </span>
                              )}
                            </td>
                            {/* ── TOTAL FEE: rental + fine ── */}
                            <td>
                              <TotalFeeBadge
                                charge={charge}
                                fine={r.fine || 0}
                              />
                            </td>
                            <td>
                              <span className="status-badge status-overdue">
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="12" className="empty-state">
                          No overdue books 🎉
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══ TAB: ALL ISSUING RECORDS ════════════════════════
                Source: /issuing | no filter
                Total Fee = charge + fine (matched from /overdues)
            ═══════════════════════════════════════════════════════ */}
            {activeTab === "all" && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Issue #</th>
                      <th>Member</th>
                      <th>Book</th>
                      <th>Email</th>
                      <th>Issue Date &amp; Time</th>
                      <th>Return Date &amp; Time</th>
                      <th>Rental (Kes)</th>
                      <th>Total Fee</th>
                      <th>Cleared</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length > 0 ? (
                      paginated.map((r) => {
                        const returned = r.is_cleared === true;
                        const isPastDue =
                          !returned && new Date(r.return_date) < new Date();
                        const statusTxt = returned
                          ? "Returned"
                          : isPastDue
                          ? "Overdue"
                          : "Active";
                        const statusCls = returned
                          ? "status-returned"
                          : isPastDue
                          ? "status-overdue"
                          : "status-active";
                        const overdue = findOverdue(overduesAll, r);
                        const fine = overdue?.fine || 0;
                        return (
                          <tr key={r.id}>
                            <td>
                              <code className="id-code">#{r.id}</code>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div
                                  className="user-avatar-sm"
                                  style={{
                                    background: getAvatarColor(
                                      r.member_name || ""
                                    ),
                                  }}
                                >
                                  {getInitials(r.member_name || "")}
                                </div>
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 700,
                                      fontSize: "0.82rem",
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
                                    ID: {r.member_id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="user-cell">
                                {r.image_url ? (
                                  <img
                                    src={r.image_url}
                                    alt={r.book_name}
                                    style={{
                                      width: 28,
                                      height: 38,
                                      objectFit: "cover",
                                      borderRadius: 4,
                                      flexShrink: 0,
                                    }}
                                    onError={(e) =>
                                      (e.target.style.display = "none")
                                    }
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 28,
                                      height: 38,
                                      borderRadius: 4,
                                      background: "var(--bg-input)",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <div>
                                  <p
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "0.82rem",
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
                                    Book ID: {r.book_id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {r.email || "—"}
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDateTime(r.issue_date)}
                            </td>
                            <td
                              style={{
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDateTime(r.return_date)}
                            </td>
                            <td>
                              <span className="charge-badge">
                                Kes {(r.charge || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* ── TOTAL FEE: rental + any fine ── */}
                            <td>
                              <TotalFeeBadge
                                charge={r.charge || 0}
                                fine={fine}
                              />
                            </td>

                            <td>
                              {r.is_cleared ? (
                                <span className="cleared-badge yes">✓ Yes</span>
                              ) : (
                                <span className="cleared-badge no">No</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${statusCls}`}>
                                {statusTxt}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="10" className="empty-state">
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

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
    </div>
  );
}