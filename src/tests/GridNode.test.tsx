import { render, screen, fireEvent } from "@testing-library/react";
import { GridNode } from "../components/GridNode";

// Mock entry data
const mockEntry = {
  id: "1",
  voltage: 230,
  timestamp: "2025-03-27T10:00:00Z",
};

describe("GridNode", () => {
  it("calls onUpdateVoltage with clamped value when Update is clicked", () => {
    const onUpdateVoltage = jest.fn();
    render(
      <GridNode
        entry={mockEntry}
        updatedId={null}
        onUpdateVoltage={onUpdateVoltage}
      />
    );

    const input = screen.getByPlaceholderText("Set voltage (220-239)");
    const updateButton = screen.getByText("Update");

    fireEvent.change(input, { target: { value: "225" } });
    fireEvent.click(updateButton);

    expect(onUpdateVoltage).toHaveBeenCalledWith("1", 225);
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("does not call onUpdateVoltage with empty input", () => {
    const onUpdateVoltage = jest.fn();
    render(
      <GridNode
        entry={mockEntry}
        updatedId={null}
        onUpdateVoltage={onUpdateVoltage}
      />
    );

    const updateButton = screen.getByText("Update");
    fireEvent.click(updateButton);

    expect(onUpdateVoltage).not.toHaveBeenCalled();
  });
});
