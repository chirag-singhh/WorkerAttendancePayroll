import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}, ref) {
  return (
    <div className={containerClassName}>
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={`input ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
