'use client';

import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ArrowLeft, 
  RefreshCw, 
  Cpu, 
  ShieldAlert,
  Users,
  Database
} from 'lucide-react';
import Table from './Table';
import MappingPreview from './MappingPreview';
import styles from './CSVImporter.module.css';

type Step = 'upload' | 'preview' | 'importing' | 'result';

export default function CSVImporter() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Local preview state
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [totalRawRows, setTotalRawRows] = useState<number>(0);
  
  // API result state
  const [successRecords, setSuccessRecords] = useState<any[]>([]);
  const [skippedRecords, setSkippedRecords] = useState<any[]>([]);
  const [totalImported, setTotalImported] = useState<number>(0);
  const [totalSkipped, setTotalSkipped] = useState<number>(0);
  
  // Active Tab in Result View
  const [activeTab, setActiveTab] = useState<'success' | 'skipped'>('success');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  // Parse CSV client-side for Preview
  const handleCSVParse = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file (.csv).');
      return;
    }
    
    setFile(selectedFile);
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError('The uploaded CSV file contains no data.');
          return;
        }
        
        setPreviewHeaders(results.meta.fields || []);
        // Display a subset of rows (first 15) for preview performance
        setPreviewRows(results.data.slice(0, 15));
        setTotalRawRows(results.data.length);
        setStep('preview');
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  }, []);

  // File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCSVParse(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVParse(e.dataTransfer.files[0]);
    }
  };

  // Trigger Import API
  const handleConfirmImport = async () => {
    if (!file) return;

    setStep('importing');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Backend URL - adjustable via env variables if hosted
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to process CSV file on backend.');
      }

      const result = await response.json();
      setSuccessRecords(result.successRecords || []);
      setSkippedRecords(result.skippedRecords || []);
      setTotalImported(result.totalImported || 0);
      setTotalSkipped(result.totalSkipped || 0);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'An error occurred during AI mapping.');
      setStep('preview');
    }
  };

  // Reset to Upload Step
  const handleReset = () => {
    setFile(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setSuccessRecords([]);
    setSkippedRecords([]);
    setTotalImported(0);
    setTotalSkipped(0);
    setTotalRawRows(0);
    setError(null);
    setStep('upload');
    setActiveTab('success');
  };

  const crmFields = [
    'created_at', 'name', 'email', 'country_code', 'mobile_without_country_code', 
    'company', 'city', 'state', 'country', 'lead_owner', 'crm_status', 
    'crm_note', 'data_source', 'possession_time', 'description'
  ];

  return (
    <div className={styles.container}>
      {/* Wizard Progress Bar */}
      <div className={styles.wizardHeader}>
        {(() => {
          const stepOrder = ['upload', 'preview', 'importing', 'result'];
          return (
            <div className={styles.wizardHeader}>
              <div className={`${styles.stepIndicator} ${step === 'upload' ? styles.activeStep : ''} ${stepOrder.indexOf(step) > stepOrder.indexOf('upload') ? styles.completedStep : ''}`}>
                <div className={styles.stepNumber}>1</div>
                <span className={styles.stepLabel}>Upload CSV</span>
              </div>
              <ChevronRight className={styles.stepChevron} size={16} />
              <div className={`${styles.stepIndicator} ${step === 'preview' ? styles.activeStep : ''} ${stepOrder.indexOf(step) > stepOrder.indexOf('preview') ? styles.completedStep : ''}`}>
                <div className={styles.stepNumber}>2</div>
                <span className={styles.stepLabel}>Preview</span>
              </div>
              <ChevronRight className={styles.stepChevron} size={16} />
              <div className={`${styles.stepIndicator} ${step === 'importing' ? styles.activeStep : ''} ${stepOrder.indexOf(step) > stepOrder.indexOf('importing') ? styles.completedStep : ''}`}>
                <div className={styles.stepNumber}>3</div>
                <span className={styles.stepLabel}>Confirm Import</span>
              </div>
              <ChevronRight className={styles.stepChevron} size={16} />
              <div className={`${styles.stepIndicator} ${step === 'result' ? styles.activeStep : ''} ${stepOrder.indexOf(step) > stepOrder.indexOf('result') ? styles.completedStep : ''}`}>
                <div className={styles.stepNumber}>4</div>
                <span className={styles.stepLabel}>AI Extraction</span>
              </div>
            </div>
          );
        })()}
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <ShieldAlert size={20} className={styles.errorIcon} />
          <div className={styles.errorContent}>
            <h4>Error Detected</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className={styles.card}>
          <h2 className={styles.title}>AI-Powered CSV Importer</h2>
          <p className={styles.subtitle}>
            Upload any CSV file. Our AI will automatically identify, map, and transform the fields into GrowEasy's target CRM layout.
          </p>

          <div className={styles.downloadSampleSection}>
            <a href="/sample_leads_messy.csv" download className={styles.downloadBtn}>
              <FileText size={16} /> Download a Messy Sample CSV to test
            </a>
          </div>

          <div 
            className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="csv-file-upload" 
              accept=".csv" 
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            <label htmlFor="csv-file-upload" className={styles.dropzoneLabel}>
              <div className={styles.uploadIconContainer}>
                <Upload className={styles.uploadIcon} size={32} />
              </div>
              <h3>Drag & drop your CSV file here</h3>
              <p>or click to browse from your computer</p>
              <span className={styles.fileHint}>Only .csv files supported</span>
            </label>
          </div>

          <div className={styles.infoSection}>
            <h4>Supported CRM Exports:</h4>
            <div className={styles.badgeGrid}>
              <span className={styles.badge}>Facebook Lead Export</span>
              <span className={styles.badge}>Google Ads Export</span>
              <span className={styles.badge}>Excel sheets</span>
              <span className={styles.badge}>Real Estate CRMs</span>
              <span className={styles.badge}>Marketing Agency CSVs</span>
              <span className={styles.badge}>Sales Reports</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className={styles.cardLarge}>
          <div className={styles.headerWithActions}>
            <div>
              <h2 className={styles.title}>Raw CSV Data Preview</h2>
              <p className={styles.subtitle}>
                Showing first 15 of {totalRawRows} rows from <strong>{file?.name}</strong>. No AI processing has started yet.
              </p>
            </div>
            <div className={styles.buttonGroup}>
              <button onClick={handleReset} className={styles.btnSecondary}>
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={handleConfirmImport} className={styles.btnPrimary}>
                Confirm & Import <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Mapping Preview before table */}
          <MappingPreview
            headers={previewHeaders}
            crmFields={crmFields}
            onMappingChange={(mapping) => {
              // You might store mapping in state if needed later
              console.log('Mapping updated', mapping);
            }}
          />

          <div className={styles.tableWrapper}>
            <Table headers={previewHeaders} rows={previewRows} maxHeight="400px" />
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className={styles.cardCentered}>
          <div className={styles.aiOrbContainer}>
            <div className={styles.aiOrb}>
              <Cpu className={styles.aiOrbIcon} size={40} />
            </div>
            <div className={styles.aiRing}></div>
            <div className={styles.aiRingSecondary}></div>
          </div>
          
          <h2 className={styles.title}>Processing with GrowEasy AI...</h2>
          <p className={styles.subtitle}>
            Chunking CSV into batches, aligning column mapping structure, formatting dates, categorizing statuses, and translating values. This may take a moment.
          </p>

          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressFillIndeterminate}></div>
            </div>
          </div>
          <span className={styles.loadingStatus}>Analyzing records & mapping CRM schemas...</span>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 'result' && (
        <div className={styles.cardLarge}>
          <div className={styles.headerWithActions}>
            <div>
              <h2 className={styles.title}>AI Extraction Completed</h2>
              <p className={styles.subtitle}>
                Successfully parsed and structured leads from <strong>{file?.name}</strong> into GrowEasy CRM layout.
              </p>
            </div>
            <button onClick={handleReset} className={styles.btnPrimary}>
              <RefreshCw size={16} /> Import Another File
            </button>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <Database size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Total Processed</span>
                <h3 className={styles.statValue}>{totalImported + totalSkipped}</h3>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Successfully Mapped</span>
                <h3 className={styles.statValue}>{totalImported}</h3>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconYellow}`}>
                <AlertTriangle size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Skipped Records</span>
                <h3 className={styles.statValue}>{totalSkipped}</h3>
              </div>
            </div>
          </div>

          {/* Tab Selection */}
          <div className={styles.tabContainer}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'success' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('success')}
            >
              <Users size={16} /> Successfully Mapped ({totalImported})
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'skipped' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('skipped')}
            >
              <AlertTriangle size={16} /> Skipped Records ({totalSkipped})
            </button>
          </div>

          {/* Tab Panels */}
          <div className={styles.tableWrapper}>
            {activeTab === 'success' ? (
              <Table 
                headers={crmFields} 
                rows={successRecords} 
                maxHeight="450px" 
              />
            ) : (
              <Table 
                headers={['name', 'email', 'mobile', 'reason']} 
                rows={skippedRecords} 
                maxHeight="450px" 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
