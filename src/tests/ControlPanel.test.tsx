import { render, screen, fireEvent } from "@testing-library/react";
import { ControlPanel } from "../components/ControlPanel";

describe("ControlPanel", () => {
  it("calls onTogglePause when Pause/Resume button is clicked", () => {
    const onTogglePause = jest.fn();
    render(
      <ControlPanel
        paused={false}
        onTogglePause={onTogglePause}
        onRefresh={jest.fn()}
        loading={false}
      />
    );

    const toggleButton = screen.getByText("Pause Updates");
    fireEvent.click(toggleButton);

    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it("calls onRefresh when Refresh Data button is clicked", () => {
    const onRefresh = jest.fn();
    render(
      <ControlPanel
        paused={false}
        onTogglePause={jest.fn()}
        onRefresh={onRefresh}
        loading={false}
      />
    );

    const refreshButton = screen.getByText("Refresh Data");
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("disables buttons when loading is true", () => {
    render(
      <ControlPanel
        paused={false}
        onTogglePause={jest.fn()}
        onRefresh={jest.fn()}
        loading={true}
      />
    );

    const toggleButton = screen.getByText("Pause Updates");
    const refreshButton = screen.getByText("Refresh Data");

    expect(toggleButton).toBeDisabled();
    expect(refreshButton).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows Resume Updates when paused is true", () => {
    render(
      <ControlPanel
        paused={true}
        onTogglePause={jest.fn()}
        onRefresh={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText("Resume Updates")).toBeInTheDocument();
    expect(screen.queryByText("Pause Updates")).not.toBeInTheDocument();
  });
});
