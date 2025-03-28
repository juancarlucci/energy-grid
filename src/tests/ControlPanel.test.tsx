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
        onAddNode={jest.fn()}
        onDeleteNode={jest.fn()}
        mutationLoading={{ add: false, delete: false }}
        nodes={[]}
      />
    );

    const toggleButton = screen.getByText("Pause Updates");
    fireEvent.click(toggleButton);

    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });
      <ControlPanel
        paused={false}
        onTogglePause={onTogglePause}
        onRefresh={onRefresh}
        loading={false}
        onAddNode={jest.fn()}
        onDeleteNode={jest.fn()}
        mutationLoading={{ add: false, delete: false }}
        nodes={[]}
      />

    );

      <ControlPanel
        paused={false}
        onTogglePause={jest.fn()}
        onRefresh={jest.fn()}
        loading={true}
        onAddNode={jest.fn()}
        onDeleteNode={jest.fn()}
        mutationLoading={false}
        nodes={[]}
      />
  it("disables buttons when loading is true", () => {
    render(
      <ControlPanel
        paused={false}
        onTogglePause={jest.fn()}
        onRefresh={jest.fn()}
        loading={true}
        onAddNode={jest.fn()}
        onDeleteNode={jest.fn()}
        mutationLoading={{ add: false, delete: false }}
        nodes={[]}
      />
      <ControlPanel
        paused={true}
        onTogglePause={jest.fn()}
        onRefresh={jest.fn()}
        loading={false}
        onAddNode={jest.fn()}
        onDeleteNode={jest.fn()}
        mutationLoading={{ add: false, delete: false }}
        nodes={[]}
      />
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
function onRefresh(): void {
  throw new Error("Function not implemented.");
}

function onTogglePause(): void {
  throw new Error("Function not implemented.");
}

