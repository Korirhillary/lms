import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Books from "./components/Books";
import Members from "./components/Members";
import Transactions from "./components/Transactions";
import Borrowers from "./components/Borrowers";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  return (
    <Router>
      <div className={`app-wrapper ${darkMode ? "dark" : "light"}`}>
        <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} />
        <div className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span />
                <span />
                <span />
              </button>
              <span className="page-title">Dashboard</span>
            </div>
            {/* <div className="search-box">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search..." />
            </div> */}
            <div className="topbar-right">
              <button
                className="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                title={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? (
                  /* SUN — visible in dark mode, click to go light */
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  /* MOON — visible in light mode, click to go dark */
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
              <div className="notif-btn">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="badge">12</span>
              </div>
              <div className="user-profile">
                <div className="user-info">
                  <span className="user-name">Korir Hillary</span>
                  <span className="user-role">Librarian</span>
                </div>
                <div className="avatar">KH</div>
              </div>
            </div>
          </header>
          <div className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/books" element={<Books />} />
              <Route path="/members" element={<Members />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/borrowers" element={<Borrowers />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;