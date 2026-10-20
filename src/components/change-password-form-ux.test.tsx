import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ChangePasswordFields, submitPasswordChange } from "./change-password-form-ux";
import { copy } from "@/lib/copy";

it.each([
  ["", "", "password"],
  ["Valid-fixture-123!", "", "confirm"],
  ["Valid-fixture-123!", "different", "confirm"],
] as const)("focuses the first invalid field for %s / %s", (password, confirm, first) => {
  const event = new Event("submit", { cancelable: true });
  const focused: string[] = [];
  let errors: { password?: string; confirm?: string } = {};
  submitPasswordChange(event, { password, confirm, pending: false, setErrors: value => { errors = value; }, focus: name => focused.push(name) });
  expect(event.defaultPrevented).toBe(true);
  expect(focused).toEqual([first]);
  expect(errors[first]).toBeTruthy();
});

it("associates validation errors with the actual password inputs", () => {
  const html = renderToStaticMarkup(<ChangePasswordFields password="" confirm="" errors={{ password: "invalid password", confirm: copy.auth.passwordMismatch }} passwordRef={{ current: null }} confirmRef={{ current: null }} onPasswordChange={() => {}} onConfirmChange={() => {}}/>);
  expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
  for (const match of html.matchAll(/aria-describedby="([^"]+)"/g)) expect(html).toContain(`id="${match[1]}"`);
  expect(html).toContain("invalid password");
  expect(html).toContain(copy.auth.passwordMismatch);
});

it("allows a valid match but blocks duplicate pending submissions without moving focus", () => {
  for (const pending of [false, true]) {
    const event = new Event("submit", { cancelable: true });
    const focused: string[] = [];
    submitPasswordChange(event, { password: "Valid-fixture-123!", confirm: "Valid-fixture-123!", pending, setErrors: () => {}, focus: name => focused.push(name) });
    expect(event.defaultPrevented).toBe(pending);
    expect(focused).toEqual([]);
  }
});
