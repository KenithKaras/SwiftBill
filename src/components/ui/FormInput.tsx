import React, { useId } from 'react';

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: string | number;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

/**
 * Standardized HTML sanitization to prevent XSS script tags injection.
 */
export function sanitizeInputValue(val: string): string {
  if (typeof val !== 'string') return val;
  // Replace HTML tag brackets with entities or remove them to prevent rendering issues
  return val.replace(/<[^>]*>/g, '').trim();
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  icon,
  error,
  type = 'text',
  placeholder,
  required = false,
  containerClassName = '',
  ...props
}) => {
  const inputId = useId();

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Sanitize input value on blur to clean up malicious scripts/HTML tags
    const cleaned = sanitizeInputValue(e.target.value);
    onChange(cleaned);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-2 flex-1 text-left ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-0.5 flex items-center gap-1"
        >
          {label}
          {required && <span className="text-negative">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-grey pointer-events-none transition-colors">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`w-full bg-white hover:bg-slate-50 border rounded py-3 transition-colors focus:outline-none focus:border-accent font-medium text-ink text-sm ${
            error ? 'border-negative focus:border-negative' : 'border-hairline'
          } ${icon ? 'pl-11 pr-4' : 'px-4'}`}
          {...props}
        />
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="text-[11px] text-negative font-medium ml-0.5 animate-fadeIn"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
