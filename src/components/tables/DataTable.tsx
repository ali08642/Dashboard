import React, { useState, memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Memoized table row component for performance
const TableRow = memo(<T extends Record<string, any>>({
  record,
  index,
  columns,
  expandable,
  isExpanded,
  onToggle
}: {
  record: T;
  index: number;
  columns: Column<T>[];
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
  };
  isExpanded: boolean;
  onToggle: (index: number) => void;
}) => {
  const canExpand = !expandable?.rowExpandable || expandable.rowExpandable(record);
  
  return (
    <>
      <tr
        className="odd:bg-white even:bg-gray-50/60 hover:bg-primary-50 transition-colors cursor-pointer"
        onClick={() => expandable && canExpand && onToggle(index)}
      >
        {expandable && (
          <td className="px-4 py-3 text-sm text-gray-800 align-middle first:pl-5 border-b border-gray-100">
            {canExpand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(index);
                }}
                className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </td>
        )}
        {columns.map((column) => (
          <td
            key={column.key}
            className="px-4 py-3 text-sm text-gray-800 align-middle first:pl-5 last:pr-5 border-b border-gray-100"
          >
            {column.render
              ? column.render((record as any)[column.key], record)
              : (record as any)[column.key]}
          </td>
        ))}
      </tr>
      {expandable && isExpanded && canExpand && (
        <tr>
          <td colSpan={columns.length + 1} className="p-0 border-b border-gray-100">
            <div className="bg-gray-50/30 px-5 py-4">
              {expandable.expandedRowRender(record)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

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
  expandable?: {
    expandedRowRender: (record: T) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
  };
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  expandable
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const Header = (
    <thead className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/70">
      <tr>
        {expandable && (
          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 first:pl-5 w-12">
            
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 first:pl-5 last:pr-5"
            style={column.width ? { width: column.width } : undefined}
          >
            {column.title}
          </th>
        ))}
      </tr>
    </thead>
  );

  if (loading) {
    return (
      <div className="relative overflow-x-auto">
        <table className="min-w-full">
          {Header}
          <tbody>
            <tr>
              <td colSpan={columns.length + (expandable ? 1 : 0)} className="py-10 text-center text-gray-500">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
                  Loading...
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="min-w-full text-left">
        {Header}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (expandable ? 1 : 0)} className="py-12 text-center">
                <div className="inline-flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100" />
                  <div className="text-sm text-gray-500">{emptyText}</div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <TableRow
                key={index}
                record={record}
                index={index}
                columns={columns}
                expandable={expandable}
                isExpanded={expandedRows.has(index)}
                onToggle={toggleRow}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(DataTable);