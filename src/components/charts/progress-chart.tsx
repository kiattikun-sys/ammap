interface ProgressChartProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressChart({ value: _value, label: _label, className }: ProgressChartProps) {
  return <div className={className}>Progress chart placeholder</div>;
}
