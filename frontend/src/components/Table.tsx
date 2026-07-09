'use client';

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

  const rowHeight = 44; // pixels
  const listHeight = Math.min(rows.length * rowHeight, parseInt(maxHeight) || 400);

  // Define column width to distribute them evenly
  const colWidth = `${100 / headers.length}%`;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = rows[index];
    return (
      <div 
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: index % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
        }}
        className={styles.tr}
        key={index}
      >
        {headers.map((header, colIdx) => {
          const cellValue = row[header];
          const displayedValue = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
          return (
            <div 
              key={colIdx} 
              className={styles.td} 
              style={{
                width: colWidth,
                padding: '10px 16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.85rem'
              }}
              title={displayedValue}
            >
              {displayedValue || <span className={styles.empty}>—</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.tableContainer} style={{ maxHeight, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Table Header */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '2px solid var(--border-color)',
        fontWeight: 700,
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {headers.map((header, idx) => (
          <div 
            key={idx} 
            style={{
              width: colWidth,
              padding: '12px 16px',
              textAlign: 'left'
            }}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <List
        height={listHeight}
        itemCount={rows.length}
        itemSize={rowHeight}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}
