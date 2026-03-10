interface DataTableProps<T> {
  data: T[];
  columns: Array<{ key: keyof T; label: string }>;
  className?: string;
}

export function DataTable<T>({ data: _data, columns: _columns, className }: DataTableProps<T>) {
  return <div className={className}>Data table placeholder</div>;
}
