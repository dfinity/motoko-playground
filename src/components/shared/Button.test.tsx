import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button component", () => {
  it("fires onClick once when clicked", () => {
    const testFn = jest.fn();

    render(<Button onClick={testFn}>Hello</Button>);

    const buttonElement = screen.getByText(/hello/i);

    expect(buttonElement).toBeInTheDocument();

    buttonElement.click();

    expect(testFn).toHaveBeenCalledTimes(1);
  });
});
