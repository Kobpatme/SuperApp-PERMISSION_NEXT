import { cloneElement, isValidElement, type FieldsetHTMLAttributes, type FormHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export function FilterBar({ className, children, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} className={["ui-filter", className].filter(Boolean).join(" ")}>{children}</form>;
}

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  controlId?: string;
  describedBy?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({ label, hint, error, required, controlId, describedBy, className, children }: FormFieldProps) {
  const hintId = hint && controlId ? `${controlId}-hint` : undefined;
  const errorId = error && controlId ? `${controlId}-error` : undefined;
  const describedByIds = [...new Set([describedBy, hintId, errorId].flatMap(value => value?.split(/\s+/).filter(Boolean) ?? []))];
  const childWithDescription = isValidElement<Record<string, unknown>>(children) && typeof children.type === "string"
    ? cloneElement(children, {
        ...(["input", "select", "textarea"].includes(children.type) ? { "aria-invalid": children.props["aria-invalid"] ?? (error ? true : undefined) } : {}),
        "aria-describedby": [...new Set([
          ...describedByIds,
          ...(typeof children.props["aria-describedby"] === "string" ? children.props["aria-describedby"].split(/\s+/).filter(Boolean) : []),
        ])].join(" ") || undefined,
      })
    : children;
  const content = (
    <>
      <span className="ui-field-label">
        {label}{required && <span className="ui-field-required" aria-hidden="true"> *</span>}
      </span>
      {childWithDescription}
      {hint && <small id={hintId} className="ui-field-hint">{hint}</small>}
      {error && <small id={errorId} className="ui-field-error" role="alert">{error}</small>}
    </>
  );
  return <label htmlFor={controlId} className={["ui-field", className].filter(Boolean).join(" ")} data-described-by={describedByIds.join(" ") || undefined} data-hint-id={hintId} data-error-id={errorId}>{content}</label>;
}

export function FormSection({ legend, help, className, children, ...props }: FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode; help?: ReactNode }) {
  return <fieldset {...props} className={["ui-form-section", className].filter(Boolean).join(" ")}><legend>{legend}</legend>{help && <p className="ui-form-section-help">{help}</p>}{children}</fieldset>;
}

export function FormGrid({ fullSpan = false, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { fullSpan?: boolean }) {
  return <div {...props} className={["ui-form-grid", fullSpan && "ui-form-grid-full", className].filter(Boolean).join(" ")}>{children}</div>;
}

type FormActionsProps = HTMLAttributes<HTMLDivElement> & { variant?: "page" | "inline" | "dialog" };
export function FormActions({ variant = "page", className, children, ...props }: FormActionsProps) {
  return <div {...props} className={[ "ui-form-actions", `ui-form-actions-${variant}`, className ].filter(Boolean).join(" ")}>{children}</div>;
}

export function mapFieldErrors(fieldErrors: Record<string, string[]> | undefined, fieldName: string): string | undefined {
  if (!fieldErrors) return undefined;
  const errors = fieldErrors[fieldName];
  return errors && errors.length > 0 ? errors[0] : undefined;
}
