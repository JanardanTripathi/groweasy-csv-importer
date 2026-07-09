import React from 'react';
import { FixedSizeList as List } from 'react-window';
import styles from './Table.module.css';

interface TableProps {
  headers: string[];
  rows: Array<Record<string, any>>;
  maxHeight?: string;
}

export default function Table({ headers, rows, maxHeight = '400px' }: TableProps) {
  if (!headers || headers.length === 0) {
    return <div className={styles.noData}>No headers available</div>;
  }

  if (!rows || rows.length === 0) {
    return <div className={styles.noData}>No records found</div>;
  }

  // Estimate row height for virtualization
  const rowHeight = 40; // in pixels, adjust as needed
  const listHeight = Math.min(rows.length * rowHeight, parseInt(maxHeight) || 400);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = rows[index];
    return (
      <tr style={style} className={styles.tr} key={index}>
        {headers.map((header, colIdx) => {
          const cellValue = row[header];
          const displayedValue = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
          return (
            <td key={colIdx} className={styles.td} title={displayedValue}>
              {displayedValue || <span className={styles.empty}>—</span>}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className={styles.tableContainer} style={{ maxHeight }}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className={styles.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <List
          height={listHeight}
          itemCount={rows.length}
          itemSize={rowHeight}
          width="100%"
          outerElementType="tbody"
        >
          {Row}
        </List>
      </table>
    </div>
  );
}
