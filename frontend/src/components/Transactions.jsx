import { useState, useEffect } from "react";
import "../styles/transactions.css";

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

// Find the matching overdue record for an issuing row (same as Borrowers)
function findOverdue(overdues, issuingRow) {
  return (
    overdues.find(
      (o) =>
        o.member_id === issuingRow.member_id && o.book_id === issuingRow.book_id
    ) || null
  );
}

export default function Transactions() {
  const [issuingAll, setIssuingAll] = useState([]);
  const [overduesAll, setOverduesAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const fetchData = () => {
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
    fetchData();
  }, []);

  // ── Transactions = only cleared (returned) issuing records ──────
  // A transaction is "created" when Return Book is clicked and is_cleared becomes true
  const transactions = issuingAll.filter((r) => r.is_cleared === true);

  // Pending = still out (is_cleared false) — these are in-progress, not yet a transaction
  const pending = issuingAll.filter((r) => r.is_cleared === false);

  // ── Stats ────────────────────────────────────────────────────────
  // Total collected = sum of charges from cleared records + their fines
  const totalCollected = transactions.reduce((sum, r) => {
    const ovd = findOverdue(overduesAll, r);
    const fine = ovd?.fine || 0;
    return sum + (r.charge || 0) + fine;
  }, 0);

  // Total fines collected (from cleared + returned-late)
  const totalFinesCollected = overduesAll
    .filter((o) => o.status === "Returned late")
    .reduce((sum, o) => sum + (o.fine || 0), 0);

  // ── Search & paginate ────────────────────────────────────────────
  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.member_name || "").toLowerCase().includes(q) ||
      (t.book_name || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      String(t.member_id || "").includes(q) ||
      String(t.book_id || "").includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="transactions-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-heading">Transactions</h1>
          <p className="page-sub">
            Completed book return transactions — generated automatically on
            successful return
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchData}>
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

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="tx-stats">
        {/* Total Transactions */}
        <div className="card tx-stat-card">
          <div className="tx-stat-icon" style={{ background: "#22c55e" }}>
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
          <div className="tx-stat-body">
            <p className="tx-stat-num">{transactions.length}</p>
            <p className="tx-stat-label">Total Transactions</p>
            <p className="tx-stat-sub">Completed returns</p>
          </div>
        </div>

        {/* Total Amount Collected */}
        <div className="card tx-stat-card">
          <div className="tx-stat-icon" style={{ background: "#3b82f6" }}>
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
          <div className="tx-stat-body">
            <p className="tx-stat-num">Kes {totalCollected.toLocaleString()}</p>
            <p className="tx-stat-label">Total Collected</p>
            <p className="tx-stat-sub">Rental + fines</p>
          </div>
        </div>

        {/* Fines Collected */}
        <div className="card tx-stat-card">
          <div className="tx-stat-icon" style={{ background: "#f59e0b" }}>
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
          <div className="tx-stat-body">
            <p className="tx-stat-num">
              Kes {totalFinesCollected.toLocaleString()}
            </p>
            <p className="tx-stat-label">Fines Collected</p>
            <p className="tx-stat-sub">From late returns</p>
          </div>
        </div>

        {/* Pending (not yet returned) */}
        <div className="card tx-stat-card">
          <div className="tx-stat-icon" style={{ background: "#e8415a" }}>
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
          <div className="tx-stat-body">
            <p className="tx-stat-num">{pending.length}</p>
            <p className="tx-stat-label">Pending</p>
            <p className="tx-stat-sub">Books not yet returned</p>
          </div>
        </div>
      </div>

      {/* ── Info banner ─────────────────────────────────────────── */}
      <div className="tx-info-banner">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: 15, height: 15, flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Transactions are automatically recorded when a book is successfully
        returned via the <strong>Borrowers</strong> page. Each row below
        represents one completed return.
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
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
              placeholder="Search member, book, email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <span className="total-count">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
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
                    <th>Tx #</th>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Book</th>
                    <th>Issued On</th>
                    <th>Returned On</th>
                    <th>Loan Days</th>
                    <th>Rental (Kes)</th>
                    <th>Fine (Kes)</th>
                    <th>Total (Kes)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((t) => {
                      const ovd = findOverdue(overduesAll, t);
                      const fine = ovd?.fine || 0;
                      const total = (t.charge || 0) + fine;
                      const issueD = new Date(t.issue_date);
                      const retD = new Date(t.return_date);
                      const loanDays =
                        !isNaN(issueD) && !isNaN(retD)
                          ? Math.round((retD - issueD) / (1000 * 60 * 60 * 24))
                          : "—";
                      const wasLate = ovd?.status === "Returned late";
                      return (
                        <tr
                          key={t.id}
                          className={wasLate ? "row-late" : "row-cleared"}
                        >
                          {/* Tx ID */}
                          <td>
                            <code className="id-code">#{t.id}</code>
                          </td>

                          {/* Member */}
                          <td>
                            <div className="user-cell">
                              <div
                                className="user-avatar-sm"
                                style={{
                                  background: getAvatarColor(
                                    t.member_name || ""
                                  ),
                                }}
                              >
                                {getInitials(t.member_name || "")}
                              </div>
                              <div>
                                <p
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {t.member_name || "—"}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  ID: {t.member_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {t.email || "—"}
                          </td>

                          {/* Book */}
                          <td>
                            <div className="user-cell">
                              {t.image_url ? (
                                <img
                                  src={t.image_url}
                                  alt={t.book_name}
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
                                  {t.book_name || "—"}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  ID: #{t.book_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Issued On */}
                          <td
                            style={{
                              fontSize: "0.78rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDateTime(t.issue_date)}
                          </td>

                          {/* Returned On (return_date from /issuing = expected, actual from /overdues) */}
                          <td
                            style={{
                              fontSize: "0.78rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ovd?.actual_return_date
                              ? formatDateTime(ovd.actual_return_date)
                              : formatDateTime(t.return_date)}
                          </td>

                          {/* Loan Days */}
                          <td style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                            {loanDays}
                            {typeof loanDays === "number" ? " day(s)" : ""}
                          </td>

                          {/* Rental charge */}
                          <td>
                            <span className="charge-badge">
                              Kes {(t.charge || 0).toLocaleString()}
                            </span>
                          </td>

                          {/* Fine */}
                          <td>
                            {fine > 0 ? (
                              <span className="fine-amount">
                                Kes {fine.toLocaleString()}
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

                          {/* Total = charge + fine */}
                          <td>
                            <div className="total-fee-cell">
                              <span
                                className={`total-fee-badge ${
                                  fine > 0 ? "has-fine" : ""
                                }`}
                              >
                                Kes {total.toLocaleString()}
                              </span>
                              {fine > 0 && (
                                <div className="fee-breakdown">
                                  <span>
                                    Rental: Kes{" "}
                                    {(t.charge || 0).toLocaleString()}
                                  </span>
                                  <span className="fee-fine">
                                    + Fine: Kes {fine.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {wasLate ? (
                              <span className="status-badge status-returned-late">
                                Returned Late
                              </span>
                            ) : (
                              <span className="status-badge status-returned">
                                ✓ Returned
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="empty-state">
                        No completed transactions yet — use the Borrowers page
                        to return a book
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
    </div>
  );
}