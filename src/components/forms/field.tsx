interface FieldProps {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, name, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
