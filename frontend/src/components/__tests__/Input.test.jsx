import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Input from "../ui/Input";

describe("Input", () => {
  it("masks a password by default", () => {
    render(<Input label="Password" name="password" type="password" value="secret" onChange={vi.fn()} />);

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("type", "password");
  });

  it("reveals the password on request, so the user can see what they typed", async () => {
    const user = userEvent.setup();
    render(<Input label="Password" name="password" type="password" value="secret" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /show password/i }));

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("type", "text");
  });

  it("hides it again", async () => {
    const user = userEvent.setup();
    render(<Input label="Password" name="password" type="password" value="secret" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /show password/i }));
    await user.click(screen.getByRole("button", { name: /hide password/i }));

    expect(screen.getByLabelText(/^password/i)).toHaveAttribute("type", "password");
  });

  it("does not submit the form it sits in", () => {
    render(<Input label="Password" name="password" type="password" value="secret" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /show password/i })).toHaveAttribute("type", "button");
  });

  it("offers no toggle on an ordinary field", () => {
    render(<Input label="Title" name="title" value="Lunch" onChange={vi.fn()} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the value it was given while revealed", async () => {
    const user = userEvent.setup();
    render(<Input label="Password" name="password" type="password" value="a long password" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /show password/i }));

    expect(screen.getByLabelText(/^password/i)).toHaveValue("a long password");
  });
});
