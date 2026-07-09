'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import styles from './CSVImporter.module.css';

interface MappingPreviewProps {
  headers: string[];
  crmFields: string[];
  onMappingChange?: (mapping: Record<string, string>) => void;
}

export default function MappingPreview({ headers, crmFields, onMappingChange }: MappingPreviewProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    // Generate initial intelligent mappings (case-insensitive fuzzy match)
    const initialMapping: Record<string, string> = {};
    
    headers.forEach(header => {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const match = crmFields.find(field => {
        const cleanField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanHeader.includes(cleanField) || cleanField.includes(cleanHeader);
      });

      if (match) {
        initialMapping[header] = match;
      }
    });

    setMapping(initialMapping);
    if (onMappingChange) {
      onMappingChange(initialMapping);
    }
  }, [headers, crmFields]);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius)',
      marginBottom: '20px'
    }}>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1.1rem',
        marginBottom: '12px',
        display: 'flex',
        align-items: 'center',
        gap: '8px',
        color: 'var(--text-primary)'
      }}>
        <Sparkles size={16} style={{ color: 'var(--accent-color)' }} /> 
        AI Mapping Recommendations
      </h3>
      <p style={{
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginBottom: '16px'
      }}>
        Verify how raw CSV headers align with target GrowEasy fields before import.
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {headers.map(header => {
          const mappedTo = mapping[header];
          return (
            <div key={header} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              <span style={{ color: 'var(--text-primary)' }}>{header}</span>
              <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
              {mappedTo ? (
                <span style={{
                  color: 'var(--success-color)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {mappedTo}
                </span>
              ) : (
                <span style={{
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  Unmapped
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
