import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cx } from "../lib/cx";

/**
 * Fields own their label, hint and error rather than leaving the caller to
 * wire ids by hand, so `aria-describedby` and `aria-invalid` are correct
 * everywhere by construction.
 *
 * Most fields on a request or a quote are required, so the annotation marks
 * the optional ones instead — less noise, and it tells you the useful thing.
 */

type FrameProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  hintId: string;
  errorId: string;
  children: ReactNode;
};

function FieldFrame({
  id,
  label,
  hint,
  error,
  optional,
  hintId,
  errorId,
  children,
}: FrameProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="bp-anno flex items-baseline justify-between gap-3 text-[9px] text-bp-graphite"
      >
        <span className="text-bp-ink">{label}</span>
        {optional ? <span className="normal-case">optional</span> : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="bp-body m-0 text-xs text-bp-graphite">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="bp-body m-0 flex items-start gap-1.5 text-xs text-bp-flag"
        >
          <span aria-hidden="true" className="bp-anno text-[9px] leading-5">
            ✕
          </span>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(
  hint: string | undefined,
  error: string | undefined,
  hintId: string,
  errorId: string,
): string | undefined {
  if (error) return errorId;
  if (hint) return hintId;
  return undefined;
}

type SharedProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

type TextFieldProps = SharedProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
    /** Tabulate the value, for amounts and anything else that lines up. */
    figure?: boolean;
  };

export function TextField({
  label,
  hint,
  error,
  optional,
  figure,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      hintId={hintId}
      errorId={errorId}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, hintId, errorId)}
        className={cx(
          "bp-input px-3 py-2 text-sm",
          figure && "bp-input-figure",
          className,
        )}
        {...rest}
      />
    </FieldFrame>
  );
}

type TextAreaFieldProps = SharedProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextAreaField({
  label,
  hint,
  error,
  optional,
  className,
  rows = 4,
  ...rest
}: TextAreaFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      hintId={hintId}
      errorId={errorId}
    >
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, hintId, errorId)}
        className={cx("bp-input resize-y px-3 py-2 text-sm", className)}
        {...rest}
      />
    </FieldFrame>
  );
}

export type SelectOption = { value: string; label: string };

type SelectFieldProps = SharedProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "children"> & {
    options: SelectOption[];
  };

export function SelectField({
  label,
  hint,
  error,
  optional,
  options,
  className,
  ...rest
}: SelectFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <FieldFrame
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      hintId={hintId}
      errorId={errorId}
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint, error, hintId, errorId)}
        className={cx("bp-input px-3 py-2 text-sm", className)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
