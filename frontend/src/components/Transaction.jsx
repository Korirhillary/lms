import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/member.css";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://lms.herokuapp.com/transactions")
      .then((res) => res.json())
      .then((data) => setTransactions(data));
  }, []);

  return (
    <div className="members-container">
      <h1>Transactions</h1>
      <table className="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Title</th>
            <th>Issue Date</th>
            <th>Return Date</th>
            <th>Fee charged</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.member_name}</td>
              <td>{transaction.book_name}</td>
              <td>{transaction.issue_date}</td>
              <td>{transaction.return_date}</td>
              <td>KES.{transaction.fee_charged.toFixed(2)}</td>
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

export default Transactions;