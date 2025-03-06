import { vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import Borrowers from "../components/Borrowers";

// Mock the fetch API
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve([
          {
            id: 1,
            member_name: "John Doe",
            book_name: "Test Book",
            issue_date: "2024-03-01",
            return_date: "2024-03-10",
            charge: 0.0,
            is_cleared: true,
            email: "john@example.com",
          },
        ]),
    })
  );
});

afterAll(() => {
  vi.restoreAllMocks(); // Clean up mocks after the test
});

test("displays the text 'Borrowers'", async () => {
  await act(async () => {
    render(
      <BrowserRouter>
        <Borrowers />
      </BrowserRouter>
    );
  });

  expect(screen.getByText("Borrowers")).toBeInTheDocument();
});