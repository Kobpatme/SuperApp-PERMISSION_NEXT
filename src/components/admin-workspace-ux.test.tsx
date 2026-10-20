import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AdminSearchFeedback, confirmAccountSecurityAction, ResetPasswordInput } from "./admin-workspace-ux";

it("keeps a visible label and associated hint on each account's temporary password", () => {
  const html = renderToStaticMarkup(<ResetPasswordInput userId="account-1"/>);
  expect(html).toContain('for="reset-password-account-1"');
  expect(html).toContain('id="reset-password-account-1"');
  expect(html).toContain('aria-describedby="reset-password-account-1-hint"');
  expect(html).toContain('id="reset-password-account-1-hint"');
  expect(html).toContain("รหัสผ่านชั่วคราว");
  expect(html).toContain('minLength="12"');
  expect(html).toContain('name="password"');
});

it("distinguishes no matches from an empty directory and offers a non-submit recovery", () => {
  let cleared = false;
  const feedback = AdminSearchFeedback({ total: 2, visible: 0, onClear: () => { cleared = true; } });
  const html = renderToStaticMarkup(feedback);
  expect(html).toContain("ไม่พบผู้ใช้ที่ตรงกับคำค้นหา");
  expect(html).toContain('type="button"');
  expect(html).toContain("ล้างคำค้นหา");
  const children = React.Children.toArray(feedback!.props.children) as React.ReactElement<{ onClick?: () => void }>[];
  children.find(child => child.props.onClick)?.props.onClick?.();
  expect(cleared).toBe(true);
  const empty = renderToStaticMarkup(<AdminSearchFeedback total={0} visible={0} onClear={() => {}}/>);
  expect(empty).toContain("ยังไม่มีผู้ใช้ในระบบ");
  expect(empty).not.toContain("ล้างคำค้นหา");
  expect(AdminSearchFeedback({ total: 2, visible: 1, onClear: () => {} })).toBeNull();
});
it("uses email alone when the selected account has no display name", () => {
  let prompt = "";
  const event = new Event("submit", { cancelable: true });
  confirmAccountSecurityAction(event, "revoke-sessions", { displayName: null, email: "fixture@example.invalid" }, message => { prompt = message; return false; });
  expect(prompt).toContain("fixture@example.invalid");
  expect(prompt).not.toContain("null");
  expect(event.defaultPrevented).toBe(true);
});

it.each(["reset-password", "revoke-sessions"] as const)("%s names the account, explains consequences, and prevents cancelled submissions", kind => {
  for (const accepted of [false, true]) {
    const event = new Event("submit", { cancelable: true });
    let prompt = "";
    confirmAccountSecurityAction(event, kind, { displayName: "ผู้ใช้ทดสอบ", email: "fixture@example.invalid" }, message => { prompt = message; return accepted; });
    expect(prompt).toContain("ผู้ใช้ทดสอบ");
    expect(prompt).toContain("fixture@example.invalid");
    expect(prompt).toContain("ทุก");
    expect(prompt).toContain(kind === "reset-password" ? "ตั้งรหัสผ่านใหม่" : "ไม่เปลี่ยนรหัสผ่าน");
    expect(event.defaultPrevented).toBe(!accepted);
  }
});
