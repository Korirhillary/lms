import { render, screen, act, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import axios from "axios";
import Dashboard from "../components/Dashboard";
import '@testing-library/jest-dom';


// Mock axios
vi.mock("axios");

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: [
        { id: 1, is_cleared: false },
        { id: 2, is_cleared: true },
        { id: 3, is_cleared: false },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders Dashboard with title", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
    });
    expect(screen.getByText("Library Management System")).toBeInTheDocument();
  });

  test("fetches and displays borrowing count", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
    });

    expect(screen.getByText("Total Books Borrowed")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Two items are not cleared
  });

  test("navigates to books page on button click", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
    });

    const booksButton = screen.getByText("📖 Books");
    fireEvent.click(booksButton);
    expect(mockNavigate).toHaveBeenCalledWith("/books");
  });

  test("opens and closes modal correctly", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
    });

    const addBookButton = screen.getByText("📖 + Add Book");
    await act(async () => {
      fireEvent.click(addBookButton);
    });

    const modal = document.getElementById("addBook");
    expect(modal).not.toBeNull();
    expect(modal.classList.contains("hidden")).toBe(false); // Check if modal is displayed

  });
});