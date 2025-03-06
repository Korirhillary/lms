import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Books from "./components/Books";
import Members from "./components/Member";
import Borrowers from "./components/Borrowers";
import Transactions from "./components/Transaction";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/books" element={<Books />} />
        <Route path="/members" element={<Members />} />
        <Route path="/borrowers" element={<Borrowers />} />
        <Route path="/transactions" element={<Transactions/>} />
      </Routes>
    </Router>
  );
};

export default App;
