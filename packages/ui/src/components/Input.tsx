import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

const fieldBase =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-primary-300 " +
  "transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "dark:bg-dark-surface dark:border-dark-border dark:text-white dark:placeholder:text-primary-400";

function FieldWrapper({
  label,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-primary dark:text-white">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-primary-400">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, leftIcon, rightIcon, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">{leftIcon}</span>}
        <input
          ref={ref}
          className={cn(fieldBase, leftIcon && "pl-10", rightIcon && "pr-10", error && "border-danger focus:ring-danger/30", className)}
          {...props}
        />
        {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300">{rightIcon}</span>}
      </div>
    </FieldWrapper>
  ),
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        className={cn(fieldBase, "min-h-[100px] resize-y", error && "border-danger focus:ring-danger/30", className)}
        {...props}
      />
    </FieldWrapper>
  ),
);
Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, required, options, placeholder, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        className={cn(fieldBase, "cursor-pointer appearance-none", error && "border-danger focus:ring-danger/30", className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  ),
);
Select.displayName = "Select";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, ...props }, ref) => (
  <label className="flex items-center gap-2 text-sm text-primary dark:text-white cursor-pointer select-none">
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-4 rounded border-border text-secondary focus:ring-2 focus:ring-secondary/40 cursor-pointer",
        className,
      )}
      {...props}
    />
    {label}
  </label>
));
Checkbox.displayName = "Checkbox";
