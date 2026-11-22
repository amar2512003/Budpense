import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Toast from "../ui/Toast";
import useUIStore from "../../store/uiStore";

beforeEach(() => {
  vi.useFakeTimers();
  useUIStore.getState().hideNotification();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Toast", () => {
  it("shows the notification and hides it after a few seconds", () => {
    render(<Toast />);

    act(() => useUIStore.getState().showNotification("Food: 85% of ₹5,000.00 used", "warning"));
    expect(screen.getByRole("status")).toHaveTextContent("Food: 85% of ₹5,000.00 used");

    act(() => vi.advanceTimersByTime(6000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("clears the notification when it unmounts, so it can't reappear for the next user", () => {
    const { unmount } = render(<Toast />);
    act(() => useUIStore.getState().showNotification("Food: ₹600.00 over your ₹5,000.00 budget", "over"));

    unmount();

    expect(useUIStore.getState().notification.visible).toBe(false);
  });
});
