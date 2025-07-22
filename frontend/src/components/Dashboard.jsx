import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";
import bannerImage from "../assets/Banner.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [borrowingCount, setBorrowingCount] = useState(0);

  useEffect(() => {
    axios
      .get("https://lms.herokuapp.com/issuing")
      .then((response) => {
        const count = response.data.filter((item) => !item.is_cleared).length;
        setBorrowingCount(count);
      })
      .catch((error) => console.error("Error fetching borrowing data:", error));
  }, []);

  return (
    <div className="dashboard-container">
      <div
        className="banner"
        style={{ backgroundImage: `url(${bannerImage})` }}
      ></div>
      <h1>Library Management System</h1>
      <div className="dashboard-content">
        <div className="stats">
          <h2>Total Books Borrowed </h2>
          <div className="borrowing-count">{borrowingCount}</div>
        </div>
        <div className="menu">
          <h3 className="heading">📚 Menu</h3>
          <hr className="separator" />
          <button className="full-width" onClick={() => navigate("/books")}>
            📖 Books
          </button>
          <button className="full-width" onClick={() => navigate("/members")}>
            👤 Members
          </button>
          <button className="full-width" onClick={() => navigate("/borrowers")}>
            📚 Borrowers
          </button>
          <button
            className="full-width"
            onClick={() => navigate("/transactions")}
          >
            📜 Transactions
          </button>
          <hr className="separator" />
        </div>
        <div className="quick-menu">
          <h3 className="heading">⚡ Quick Buttons</h3>
          <hr className="separator" />
          <button className="full" onClick={() => openModal("addBook")}>
            📖 + Add Book
          </button>
          <button className="full" onClick={() => openModal("addMember")}>
            👤 + Add Member
          </button>
          <button className="full" onClick={() => openModal("addBorrower")}>
            📚 + Add Borrower
          </button>
          <hr className="separat" />
        </div>
      </div>
      <Modal
        id="addBook"
        title="Add Book"
        fields={["Title", "Author", "Stock", "Image URL"]}
        apiEndpoint="http://127.0.0.1:5000/books"
      />
      <Modal
        id="addMember"
        title="Add Member"
        fields={["Name", "Email"]}
        apiEndpoint="http://127.0.0.1:5000/members"
      />
      <Modal
        id="addBorrower"
        title="Add Borrower"
        fields={["Book Name", "Email"]}
        apiEndpoint="http://127.0.0.1:5000/issuing"
      />
    </div>
  );
};

const openModal = (id) => {
  document.getElementById(id).style.display = "block";
};

const closeModal = (id) => {
  document.getElementById(id).style.display = "none";
};

const Modal = ({ id, title, fields, apiEndpoint }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    axios
      .post(apiEndpoint, formData)
      .then((response) => {
        setMessage(response.data.message);
        setTimeout(() => setMessage(""), 3000);
        setTimeout(() => setFormData({}), 2000);
      })
      .catch((error) => {
        setMessage(
          error.response?.data?.message || "Could not complete request"
        );
        setTimeout(() => setMessage(""), 3000);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div id={id} className="modal">
      <div className="modal-content">
        <span className="close" onClick={() => closeModal(id)}>
          &times;
        </span>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {fields.map((field) => (
            <input
              className="input-button"
              key={field}
              name={field.toLowerCase().replace(" ", "_")}
              placeholder={field}
              onChange={handleChange}
              value={formData[field.toLowerCase().replace(" ", "_")] || ""}
              required
            />
          ))}
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? <span className="loading-spinner"></span> : "Submit"}
          </button>
          {message && <div className="message-box">{message}</div>}
        </form>
      </div>
    </div>
  );
};

export default Dashboard;