import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import "../styles/book.css";

const Books = () => {
  const [books, setBooks] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://lms.herokuapp.com/books")
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
        setFilteredBooks(data);
      });
  }, []);

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchClick = () => {
    const lowercasedInput = searchInput.toLowerCase();
    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowercasedInput) ||
        book.author.toLowerCase().includes(lowercasedInput)
    );
    setFilteredBooks(filtered);
  };

  return (
    <div className="books-container">
      <h1>Books</h1>
      <button className="home" onClick={() => navigate("/")}>
        Home
      </button>
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="I'm looking for..."
          value={searchInput}
          onChange={handleInputChange}
          className="search-input"
        />
        <button className="search-button" onClick={handleSearchClick}>
          Search
        </button>
      </div>
      {filteredBooks.length === 0 && searchInput.trim() !== "" ? (
        <h1>Sorry, no result for "{searchInput}" found</h1>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div key={book.id} className="book-card">
              <img src={book.image_url} alt={book.title} className="book-img" />
              <h3>{book.title}</h3>
              <p>Author: {book.author}</p>
              <p>Stock: {book.stock}</p>
              <p className={book.stock === 0 ? "out-of-stock" : "available"}>
                {book.stock === 0 ? "Out of Stock" : "Available"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Books;

