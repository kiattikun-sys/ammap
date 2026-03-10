interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextInput({ label: _label, error: _error, ...props }: TextInputProps) {
  return <input type="text" {...props} />;
}
