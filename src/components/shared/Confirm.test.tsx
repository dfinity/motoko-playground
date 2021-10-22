import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Confirm } from "./Confirm";

describe("Confirm component", () => {
  const confirmFn = jest.fn();
  const cancelFn = jest.fn();

  const StatefulConfirm = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Confirm</button>
        <Confirm
          isOpen={isOpen}
          close={() => setIsOpen(false)}
          onConfirm={confirmFn}
          onCancel={cancelFn}
        >
          Hello
        </Confirm>
      </>
    );
  };

  it("opens and calls the confirm function", async () => {
    render(<StatefulConfirm />);

    const buttonElement = screen.getByText(/open confirm/i);

    buttonElement.click();

    const confirmText = screen.getByText(/hello/i);
    const confirmButton = screen.getByText(/continue/i);

    await waitFor(() => expect(confirmText).toBeVisible());

    confirmButton.click();

    expect(confirmFn).toHaveBeenCalledTimes(1);
    expect(confirmText).not.toBeVisible();
  });

  it("opens and calls the cancel function", async () => {
    render(<StatefulConfirm />);
    const buttonElement = screen.getByText(/open confirm/i);

    buttonElement.click();

    const confirmText = screen.getByText(/hello/i);
    const cancelButton = screen.getByText(/cancel/i);

    await waitFor(() => expect(confirmText).toBeVisible());

    cancelButton.click();

    expect(cancelFn).toHaveBeenCalledTimes(1);
    expect(confirmText).not.toBeVisible();
  });
});
