import { vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Transactions from "../components/Transaction";
import "@testing-library/jest-dom"; 

// Mock the fetch function
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        {
          id: 1,
          member_name: "John Doe",
          book_name: "React Basics",
          issue_date: "2024-03-01",
          return_date: "2024-03-10",
          fee_charged: 50.0,
        },
      ]),
  })
);

describe("Transactions Component", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test("renders Transactions table and data correctly", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Transactions />
        </BrowserRouter>
      );
    });

    expect(screen.getByText(/transactions/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("React Basics")).toBeInTheDocument();
      expect(screen.getByText("2024-03-01")).toBeInTheDocument();
      expect(screen.getByText("KES.50.00")).toBeInTheDocument();
    });
  });

  test("renders home button", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Transactions />
        </BrowserRouter>
      );
    });

    const homeButton = screen.getByText(/home/i);
    expect(homeButton).toBeInTheDocument();
  });
});