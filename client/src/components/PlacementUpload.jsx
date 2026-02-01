import { useState, useRef } from 'react';

function PlacementUpload({ setMessage, setError }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [filePreview, setFilePreview] = useState([]);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const templateContent = [
      'SrNo,CompanyName,Criteria,Condition,Male,Female,Package,NoOfRound,QuestionsAsked,SubjectsCovered,SkillsRequired,Suggestion,Type',
      '1,BMC Softwares,PPO,All UG,2,5,14,3,18,"DSA, OOPs, DBMS, OS","Java, Communication, Problem Solving, Teamwork",Focus on strong foundation in core subjects (DSA/OOP/DBMS).,Placement',
      '2,Siemens,PPO,All UG,2,4,11,4,15,"DSA, OOPs, Networks, OS, Projects","Python, Communication, Problem Solving, DSA",Practice mock interviews and enhance soft skills like communication.,Internship'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'placement_report_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setMessage('');
    setValidationError('');
    setFilePreview([]);

    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setValidationError('Please upload a valid CSV file');
      alert('Please upload a valid CSV file (.csv extension required)');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').slice(0, 6); // first 6 lines
        setFilePreview(lines);

        const headers = lines[0]?.trim().split(',').map(h => h.trim());
        const requiredHeaders = ['SrNo', 'CompanyName', 'Criteria', 'Male', 'Female', 'Package', 'Type'];
        const hasRequiredHeaders = requiredHeaders.every(header =>
          headers?.some(h => h.toLowerCase().includes(header.toLowerCase()))
        );

        if (!hasRequiredHeaders) {
          const errorMsg = 'CSV does not match placement report format. Please use the template.';
          setValidationError(errorMsg);
          alert(errorMsg);
          resetFileInput();
        }
      } catch {
        const errorMsg = 'Error reading file content';
        setValidationError(errorMsg);
        alert(errorMsg);
      }
    };
    reader.onerror = () => {
      const errorMsg = 'Error reading file';
      setValidationError(errorMsg);
      alert(errorMsg);
    };
    reader.readAsText(selectedFile);
  };

  const resetFileInput = () => {
    setFile(null);
    setFilePreview([]);
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Please select a valid CSV file first');
      return;
    }

    if (validationError) {
      setError('Please fix validation errors before uploading');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', 'tec@mentorconnect.com');

    try {
      const response = await fetch('http://localhost:5000/api/upload-placement', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage = `Successfully uploaded placement data for ${data.processedCount} companies`;
        setMessage(successMessage);
        alert(successMessage);
        resetFileInput();
      } else {
        const errorMsg = data.error || 'Error uploading placement data';
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.uploadContainer}>
      <div style={styles.templateSection}>
        <button type="button" onClick={downloadTemplate} style={styles.downloadTemplateBtn}>
          Download Placement Report Template
        </button>
        <p style={styles.templateHint}>
          Use this template to ensure proper formatting for placement data
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fileSelectionArea}>
          {!file && (
            <label style={styles.fileInputLabel}>
              <span>Choose Placement Report CSV File</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          )}

          {file && (
            <div style={styles.fileInfo}>
              <span style={styles.fileName}>Selected: {file.name}</span>
              <button type="button" onClick={resetFileInput} style={styles.changeFileBtn}>
                Change File
              </button>
            </div>
          )}
        </div>

        {filePreview.length > 0 && (
          <div style={styles.filePreview}>
            <h4>File Preview (first 5 rows):</h4>
            <div style={styles.previewContent}>
              {filePreview.map((line, index) => (
                <div key={index} style={styles.previewLine}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {validationError && (
          <div style={{ ...styles.validationMessage, ...styles.error }}>{validationError}</div>
        )}

        <div style={styles.uploadActions}>
          <button
            type="submit"
            disabled={!file || isUploading || validationError}
            style={{
              ...styles.uploadBtn,
              ...(isUploading ? styles.uploadingBtn : {}),
              ...(!file || validationError ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
          >
            {isUploading ? (
              <>
                <span style={styles.spinner}></span>
                Uploading Placement Data...
              </>
            ) : (
              'Upload Placement Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  uploadContainer: { 
    background: '#fff', 
    padding: '1.5rem', 
    borderRadius: '10px', 
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)', 
    marginTop: '1rem' 
  },
  templateSection: { 
    marginBottom: '1rem',
    textAlign: 'center'
  },
  downloadTemplateBtn: { 
    background: '#1b5e20', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '6px', 
    padding: '0.75rem 1.5rem', 
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  templateHint: { 
    fontSize: '0.9rem', 
    color: '#555', 
    marginTop: '0.5rem'
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1rem' 
  },
  fileSelectionArea: { 
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  fileInputLabel: { 
    padding: '1rem 2rem', 
    border: '2px dashed #ccc', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    display: 'inline-block', 
    background: '#f8f9fa',
    fontWeight: 'bold',
    color: '#555'
  },
  fileInfo: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '1rem',
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  fileName: { 
    fontWeight: 'bold' 
  },
  changeFileBtn: { 
    padding: '0.5rem 1rem', 
    borderRadius: '4px', 
    border: 'none', 
    background: '#f57c00', 
    color: '#fff', 
    cursor: 'pointer' 
  },
  filePreview: { 
    marginTop: '0.5rem', 
    background: '#f5f5f5', 
    padding: '1rem', 
    borderRadius: '6px', 
    fontSize: '0.85rem' 
  },
  previewContent: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '0.3rem',
    fontFamily: 'monospace'
  },
  previewLine: { 
    whiteSpace: 'pre-wrap',
    padding: '0.2rem 0'
  },
  validationMessage: { 
    padding: '1rem', 
    borderRadius: '6px', 
    fontSize: '0.9rem',
    textAlign: 'center'
  },
  error: { 
    background: '#ffebee', 
    color: '#b71c1c' 
  },
  uploadActions: { 
    marginTop: '0.5rem',
    textAlign: 'center'
  },
  uploadBtn: { 
    padding: '0.75rem 2rem', 
    borderRadius: '6px', 
    border: 'none', 
    background: '#1b5e20', 
    color: '#fff', 
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  uploadingBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '0.5rem' 
  },
  spinner: { 
    width: '16px', 
    height: '16px', 
    border: '2px solid #fff', 
    borderTop: '2px solid transparent', 
    borderRadius: '50%', 
    animation: 'spin 1s linear infinite' 
  }
};

export default PlacementUpload;