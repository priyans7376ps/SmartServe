import React, { useState, useId } from 'react';
import { cva } from 'class-variance-authority';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/cn';

/* ── CVA INPUT WRAPPER ───────────────────────────────── */
const inputWrapperVariants = cva(
  [
    'relative flex items-center w-full rounded-xl',
    'bg-surface-1 border transition-all duration-200',
    'ring-0 focus-within:ring-2 focus-within:ring-offset-0',
  ],
  {
    variants: {
      state: {
        default: [
          'border-default hover:border-strong',
          'focus-within:border-brand-500 focus-within:ring-brand-500/20',
        ],
        error: [
          'border-error-border bg-error-bg/30',
          'focus-within:border-error-500 focus-within:ring-error-500/20',
        ],
        success: [
          'border-success-border',
          'focus-within:border-success-500 focus-within:ring-success-500/20',
        ],
      },
      size: {
        sm: 'h-10 px-3 text-sm  rounded-lg',
        md: 'h-12 px-4 text-sm  rounded-xl',
        lg: 'h-14 px-5 text-body rounded-2xl',
      },
    },
    defaultVariants: { state: 'default', size: 'md' },
  }
);

export default function Input({
  label,
  error,
  success,
  hint,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  size = 'md',
  id: idProp,
  required,
  disabled,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = idProp || generatedId;

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const state = error ? 'error' : success ? 'success' : 'default';

  const hasValue = value !== '' && value !== undefined && value !== null;
  const showClear = hasValue && !isPassword && !disabled;

  /* Padding calc */
  const pl = Icon ? (size === 'lg' ? 'pl-12' : 'pl-10') : undefined;
  const pr = (isPassword || showClear)
    ? (size === 'lg' ? 'pr-12' : 'pr-10')
    : undefined;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-label font-bold uppercase tracking-widest transition-colors duration-150',
            isFocused ? 'text-brand-600 dark:text-brand-400' : 'text-ink-secondary',
            error && 'text-error-text',
          )}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-error-500" aria-hidden="true"> *</span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className={cn(inputWrapperVariants({ state, size }))}>
        {/* Left icon */}
        {Icon && (
          <Icon
            className={cn(
              'absolute shrink-0 transition-colors duration-150',
              size === 'lg' ? 'left-4 w-5 h-5' : 'left-3 w-4 h-4',
              isFocused ? 'text-brand-500' : 'text-ink-muted',
            )}
            aria-hidden="true"
          />
        )}

        <input
          id={inputId}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error`
            : hint  ? `${inputId}-hint`
            : undefined
          }
          className={cn(
            'w-full bg-transparent text-ink-primary font-medium',
            'placeholder:text-ink-muted placeholder:font-normal',
            'outline-none disabled:opacity-40 disabled:cursor-not-allowed',
            pl, pr,
            inputClassName,
          )}
          {...props}
        />

        {/* Right controls */}
        <div className="absolute right-3 flex items-center gap-1">
          {showClear && (
            <button
              type="button"
              onClick={() => onChange?.({ target: { value: '' } })}
              className="p-1 rounded-md text-ink-muted hover:text-ink-primary transition-colors"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="p-1 rounded-md text-ink-muted hover:text-ink-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeOff className="w-4 h-4" />
                : <Eye    className="w-4 h-4" />}
            </button>
          )}

          {!isPassword && state === 'error'   && <AlertCircle  className="w-4 h-4 text-error-500"   aria-hidden="true" />}
          {!isPassword && state === 'success' && <CheckCircle2 className="w-4 h-4 text-success-500" aria-hidden="true" />}
        </div>
      </div>

      {/* Feedback text */}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-caption text-error-text font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
