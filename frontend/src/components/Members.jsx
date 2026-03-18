import { useState, useEffect } from "react";
import "../styles/members.css";

const API = "http://127.0.0.1:5000";

const avatarColors = ["#e8415a","#7c4dff","#00bcd4","#ff9800","#4caf50","#e91e63","#2196f3","#ff5722"];
function getAvatarColor(str) {
  let h = 0; for (let c of (str||"")) h = c.charCodeAt(0) + ((h<<5)-h);
  return avatarColors[Math.abs(h) % avatarColors.length];
}
function getInitials(name) {
  return (name||"?").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
}
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { day:"2-digit", month:"short", year:"numeric" });
}

export default function Members() {
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg]       = useState({ type:"", text:"" });
  const [form, setForm]             = useState({ name:"", email:"" });
  const [page, setPage]             = useState(1);
  const perPage = 8;

  const fetchMembers = () => {
    setLoading(true);
    fetch(`${API}/members`)
      .then(r => r.json())
      .then(d => { setMembers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, []);

  // ── Stats ─────────────────────────────────────────────────────
  const totalDebt    = members.reduce((s, m) => s + (m.outstanding_debt || 0), 0);
  const withDebt     = members.filter(m => (m.outstanding_debt || 0) > 0).length;
  const clearMembers = members.filter(m => (m.outstanding_debt || 0) === 0).length;

  // ── Search & paginate ─────────────────────────────────────────
  const filtered = members.filter(m =>
    (m.name  || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(search.toLowerCase()) ||
    String(m.id || "").includes(search)
  );
  const paginated  = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // ── Modal ─────────────────────────────────────────────────────
  const openModal = () => {
    setForm({ name:"", email:"" });
    setSaveMsg({ type:"", text:"" });
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSaveMsg({ type:"", text:"" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg({ type:"", text:"" });
    try {
      const res = await fetch(`${API}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg({ type:"success", text: data.message || "Member added successfully" });
        fetchMembers();
        setTimeout(() => closeModal(), 1800);
      } else {
        setSaveMsg({ type:"error", text: data.message || data.error || "Failed to add member. Please try again." });
      }
    } catch {
      setSaveMsg({ type:"error", text:"Network error. Make sure the server is running." });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="members-page">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-heading">Members</h1>
          <p className="page-sub">Manage library members and their outstanding balances</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-outline" onClick={fetchMembers}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Member
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <div className="members-stats">

        <div className="card mb-stat-card">
          <div className="mb-stat-icon" style={{background:"#3b82f6"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p className="mb-stat-num">{members.length}</p>
            <p className="mb-stat-label">Total Members</p>
          </div>
        </div>

        <div className="card mb-stat-card">
          <div className="mb-stat-icon" style={{background:"#ef4444"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <p className="mb-stat-num">Kes {totalDebt.toLocaleString()}</p>
            <p className="mb-stat-label">Total Outstanding Debt</p>
          </div>
        </div>

        <div className="card mb-stat-card">
          <div className="mb-stat-icon" style={{background:"#f59e0b"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="mb-stat-num">{withDebt}</p>
            <p className="mb-stat-label">Members with Debt</p>
          </div>
        </div>

        <div className="card mb-stat-card">
          <div className="mb-stat-icon" style={{background:"#22c55e"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div>
            <p className="mb-stat-num">{clearMembers}</p>
            <p className="mb-stat-label">Clear Members</p>
          </div>
        </div>

      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="card" style={{ padding:0 }}>

        {/* Controls */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div className="search-box" style={{ maxWidth:320 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Search by name, email or ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <span className="total-count">{filtered.length} member{filtered.length!==1?"s":""}</span>
        </div>

        {loading ? (
          <div className="loading-state" style={{padding:60}}><div className="spinner"/></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Outstanding Debt</th>
                    <th>Debt Status</th>
                    <th>Member Since</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? paginated.map((m) => {
                    const debt       = m.outstanding_debt || 0;
                    const hasDebt    = debt > 0;
                    const debtLevel  = debt === 0 ? "clear" : debt <= 500 ? "low" : "high";
                    return (
                      <tr key={m.id} className={hasDebt ? "row-has-debt" : ""}>

                        {/* ID */}
                        <td><code className="id-code">#{m.id}</code></td>

                        {/* Member avatar + name */}
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-sm" style={{background: getAvatarColor(m.name||"")}}>
                              {getInitials(m.name||"")}
                            </div>
                            <div>
                              <p style={{fontWeight:700, fontSize:"0.88rem", lineHeight:1.2}}>{m.name||"—"}</p>
                              <p style={{fontSize:"0.7rem", color:"var(--text-muted)"}}>ID: {m.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{fontSize:"0.82rem", color:"var(--text-secondary)"}}>{m.email||"—"}</td>

                        {/* Outstanding debt amount */}
                        <td>
                          {hasDebt ? (
                            <span className={`debt-amount ${debtLevel}`}>
                              Kes {debt.toLocaleString()}
                            </span>
                          ) : (
                            <span className="debt-clear">—</span>
                          )}
                        </td>

                        {/* Debt status badge */}
                        <td>
                          {debtLevel === "clear" ? (
                            <span className="status-badge status-clear">✓ Clear</span>
                          ) : debtLevel === "low" ? (
                            <span className="status-badge status-debt-low">Owing</span>
                          ) : (
                            <span className="status-badge status-debt-high">High Debt</span>
                          )}
                        </td>

                        {/* Member since */}
                        <td style={{fontSize:"0.78rem", color:"var(--text-muted)", whiteSpace:"nowrap"}}>
                          {formatDate(m.created_at)}
                        </td>

                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="6" className="empty-state">No members found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{padding:"14px 20px"}}>
                <button className="page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:11,height:11}}>
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {Array.from({length:totalPages},(_,i)=>(
                  <button key={i+1} className={`page-btn ${page===i+1?"active":""}`}
                    onClick={()=>setPage(i+1)}>{i+1}</button>
                ))}
                <button className="page-btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:11,height:11}}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add Member Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal member-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </div>
                <div>
                  <h3>Add New Member</h3>
                  <p className="modal-subtitle">Register a new library member</p>
                </div>
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="modal-form">

              {/* Name */}
              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
                <input
                  required
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Email Address <span className="req">*</span></label>
                <input
                  required
                  type="email"
                  placeholder="e.g. janedoe@gmail.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>

              {/* Success / Error message */}
              {saveMsg.text && (
                <div className={`modal-alert ${saveMsg.type}`}>
                  {saveMsg.type === "success" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,flexShrink:0}}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,flexShrink:0}}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                  {saveMsg.text}
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saveLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? (
                    <><span className="btn-spinner"/> Adding...</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Member
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