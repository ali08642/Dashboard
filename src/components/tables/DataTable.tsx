import React from 'react';

interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data available'
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="text-left px-4 py-3 text-xs font-semibold text-[#86868b] uppercase tracking-[0.06em] border-b border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)]"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td 
                colSpan={columns.length}
                className="text-center py-10 text-[#86868b]"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[rgba(0,0,0,0.1)] border-t-[#0071e3] rounded-full animate-spin" />
                  Loading data...
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left px-4 py-3 text-xs font-semibold text-[#86868b] uppercase tracking-[0.06em] border-b border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)]"
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length}
                className="text-center py-10 text-[#86868b]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr 
                key={index}
                className="hover:bg-[rgba(0,113,227,0.02)] transition-colors duration-200"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-4 text-sm border-b border-[rgba(0,0,0,0.08)] last:border-b-0"
                  >
                    {column.render 
                      ? column.render(record[column.key], record)
                      : record[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}