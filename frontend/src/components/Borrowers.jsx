import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/borrower.css";

const Borrowers = () => {
  const [borrowers, setBorrowers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const fetchBorrowers = () => {
    fetch("http://127.0.0.1:5000/issuing")
      .then((res) => res.json())
      .then((data) => setBorrowers(data))
      .catch((error) => console.error("Error fetching borrowers:", error));
  };

  const markBookReturn = (bookName, email) => {
    fetch("https://lms.herokuapp.com/issuing", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ book_name: bookName, email: email }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        fetchBorrowers(); // Refresh data dynamically
      })
      .catch((error) => console.error("Error marking return:", error));
  };

  return (
    <div className="borrowers-container">
      <h1>Borrowers</h1>
      <table className="borrowers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Member Name</th>
            <th>Book Title</th>
            <th>Issue Date</th>
            <th>Return Date</th>
            <th>Charge</th>
            <th>Cleared</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {borrowers.map((borrower) => (
            <tr key={borrower.id}>
              <td>{borrower.id}</td>
              <td>{borrower.member_name}</td>
              <td>{borrower.book_name}</td>
              <td>{borrower.issue_date}</td>
              <td>{borrower.return_date}</td>
              <td>KES.{borrower.charge.toFixed(2)}</td>
              <td>{borrower.is_cleared ? "Yes" : "No"}</td>
              <td>
                {!borrower.is_cleared && (
                  <button
                    onClick={() =>
                      markBookReturn(borrower.book_name, borrower.email)
                    }
                  >
                    Mark Book Return
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="home" onClick={() => navigate("/")}>
        Home
      </button>
    </div>
  );
};

export default Borrowers;