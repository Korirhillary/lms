import { render, screen, act, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Members from "../components/Member";
import "@testing-library/jest-dom";

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Members Component", () => {
  beforeEach(() => {
    // Mock fetch API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, name: "Alice", email: "alice@example.com", outstanding_debt: 500 },
            { id: 2, name: "Bob", email: "bob@example.com", outstanding_debt: 0 },
          ]),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders Members component and fetches members", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Members />
        </BrowserRouter>
      );
    });

    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Outstanding Debt")).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("KES.500.00")).toBeInTheDocument();

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("KES.0.00")).toBeInTheDocument();
  });

  test("navigates to home when Home button is clicked", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Members />
        </BrowserRouter>
      );
    });

    const homeButton = screen.getByText("Home");
    fireEvent.click(homeButton);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});