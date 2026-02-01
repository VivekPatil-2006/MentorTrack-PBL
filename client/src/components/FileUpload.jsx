import { useState, useRef } from 'react';

function FileUpload({ examType, setMessage, setError }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [subjectColumns, setSubjectColumns] = useState([]);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    // Create a template with example subjects
    const templateContent = [
      'email,Mathematics,Physics,Chemistry,Biology',
      'student1@example.com,85,78,92,88',
      'student2@example.com,90,85,79,95'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examType}_marks_template.csv`;
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
    setSubjectColumns([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setValidationError('Please upload a valid CSV file');
      alert('Please upload a valid CSV file (.csv extension required)');
      return;
    }

    const normalizedFilename = selectedFile.name.toLowerCase();
    if (!normalizedFilename.includes(examType.toLowerCase())) {
      const errorMsg = `Selected file "${selectedFile.name}" doesn't match ${examType}. Please upload a ${examType} marks file.`;
      setValidationError(errorMsg);
      alert(errorMsg);
      resetFileInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          const errorMsg = 'CSV file is empty or has insufficient data';
          setValidationError(errorMsg);
          alert(errorMsg);
          return;
        }

        const headers = lines[0].trim().split(',').map(h => h.trim());
        
        // Validate email column
        const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
        if (emailIndex === -1) {
          const errorMsg = 'CSV must contain an "email" column';
          setValidationError(errorMsg);
          alert(errorMsg);
          return;
        }

        // Extract all non-email columns as subjects
        const subjects = headers.filter((h, index) => index !== emailIndex);
        
        if (subjects.length === 0) {
          const errorMsg = 'No subject columns found. Please add subject columns after the email column.';
          setValidationError(errorMsg);
          alert(errorMsg);
          return;
        }

        // Validate data rows
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].trim().split(',').map(cell => cell.trim());
          
          // Skip empty rows
          if (row.length === 1 && row[0] === '') continue;
          
          // Validate email format in each row
          const email = row[emailIndex];
          if (email && !isValidEmail(email)) {
            const errorMsg = `Invalid email format in row ${i + 1}: ${email}`;
            setValidationError(errorMsg);
            alert(errorMsg);
            return;
          }

          // Validate marks are numbers for subject columns
          for (let j = 0; j < row.length; j++) {
            if (j !== emailIndex && row[j] !== '') {
              const mark = parseFloat(row[j]);
              if (isNaN(mark) || mark < 0) {
                const errorMsg = `Invalid marks value in row ${i + 1}, column "${headers[j]}": ${row[j]}`;
                setValidationError(errorMsg);
                alert(errorMsg);
                return;
              }
            }
          }
        }

        setSubjectColumns(subjects);
        setMessage(`Successfully validated CSV with ${subjects.length} subjects`);
        
      } catch (error) {
        console.error('Error processing file:', error);
        const errorMsg = 'Error reading file content. Please check the file format.';
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

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetFileInput = () => {
    setFile(null);
    setSubjectColumns([]);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

    if (subjectColumns.length === 0) {
      setError('No valid subjects found in the CSV file');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('examType', examType);
    formData.append('subjects', JSON.stringify(subjectColumns));
    formData.append('email', 'tec@mentorconnect.com');
    formData.append('password', 'Tec@123');

    try {
      const response = await fetch('http://localhost:5000/api/upload-marks', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage = `Successfully uploaded marks for ${data.processedCount} students to students/{email}/exam/${examType}/`;
        setMessage(successMessage);
        alert(successMessage);
        resetFileInput();
      } else {
        const errorMsg = data.error || 'Error uploading marks';
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = 'Failed to connect to server. Please try again.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.uploadContainer}>
      <div style={styles.templateSection}>
        <button type="button" onClick={downloadTemplate} style={styles.downloadTemplateBtn}>
          Download {examType} Template
        </button>
        <p style={styles.templateHint}>
          CSV format: email,subject1,subject2,... (Marks will be stored in students/email/exam/{examType}/)
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fileSelectionArea}>
          <label style={styles.fileInputLabel}>
            <span>{file ? 'Change CSV File' : `Choose ${examType} CSV File`}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {file && (
          <div style={styles.fileInfo}>
            Selected: {file.name}
          </div>
        )}

        {validationError && (
          <div style={styles.errorMessage}>
            {validationError}
          </div>
        )}

        {subjectColumns.length > 0 && (
          <div style={styles.successMessage}>
            <div style={styles.detectedInfo}>
              <strong>File validated successfully!</strong>
              <div style={styles.subjectList}>
                <span>Detected Subjects ({subjectColumns.length}):</span>
                <div style={styles.subjectTags}>
                  {subjectColumns.map((subject, index) => (
                    <span key={index} style={styles.subjectTag}>{subject}</span>
                  ))}
                </div>
              </div>
              <div style={styles.storageInfo}>
                Data will be stored in: <code>students/email/exam/{examType}/</code>
              </div>
            </div>
          </div>
        )}

        <div style={styles.uploadActions}>
          <button
            type="submit"
            disabled={!file || isUploading || validationError || subjectColumns.length === 0}
            style={{
              ...styles.uploadBtn,
              ...(isUploading ? styles.uploadingBtn : {}),
              ...((!file || validationError || subjectColumns.length === 0) ? 
                { opacity: 0.6, cursor: 'not-allowed' } : {})
            }}
          >
            {isUploading ? (
              <>
                <span style={styles.spinner}></span>
                Uploading to Firebase...
              </>
            ) : `Upload ${subjectColumns.length} Subjects`}
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
    marginTop: '0.5rem',
    fontStyle: 'italic'
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
    color: '#555',
    transition: 'all 0.3s ease'
  },
  fileInfo: {
    textAlign: 'center',
    padding: '0.5rem',
    background: '#e3f2fd',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  errorMessage: {
    background: '#ffebee',
    color: '#c62828',
    padding: '1rem',
    borderRadius: '6px',
    textAlign: 'center'
  },
  successMessage: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '1rem',
    borderRadius: '6px',
    textAlign: 'center'
  },
  detectedInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  subjectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center'
  },
  subjectTags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  subjectTag: { 
    background: '#c8e6c9', 
    padding: '0.3rem 0.75rem', 
    borderRadius: '20px', 
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#1b5e20'
  },
  storageInfo: {
    fontSize: '0.8rem',
    marginTop: '0.5rem',
    fontFamily: 'monospace',
    background: '#f5f5f5',
    padding: '0.5rem',
    borderRadius: '4px'
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
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
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

// Add CSS animation for spinner
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

export default FileUpload;