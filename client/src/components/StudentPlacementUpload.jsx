import { useState } from 'react';
import axios from 'axios';

function StudentPlacementUpload({ technicianEmail, setMessage, setError }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const downloadTemplate = () => {
    const templateContent = [
      'Email,Name,Department,Placement Company,Placement Role,Placement Date,Internship Company,Internship Role,Internship Start Date,Internship End Date,Internship Stipend,Parent Mail',
      'student1@example.com,John Doe,Computer Science,Google,Software Engineer,2025-06-15,Microsoft,SDE Intern,2025-05-01,2025-07-31,15000,parent1@example.com',
      'student2@example.com,Jane Smith,Electronics,TCS,Data Analyst,2025-06-20,Infosys,Data Science Intern,2025-04-15,2025-07-15,12000,parent2@example.com'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_placement_internship_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      setMessage('');
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', technicianEmail);

    try {
      const response = await axios.post('http://localhost:5000/api/upload-student-placement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        setError('Failed to upload student placement data.');
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Server error while uploading file.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Upload Student Placement & Internship CSV</h3>
      
      <div style={styles.templateSection}>
        <button type="button" onClick={downloadTemplate} style={styles.downloadTemplateBtn}>
          Download Template
        </button>
        <p style={styles.templateHint}>
          CSV format: Email, Name, Department, Placement Company, Placement Role, Placement Date, Internship Company, Internship Role, Internship Start Date, Internship End Date, Internship Stipend, Parent Mail
        </p>
      </div>

      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        style={styles.fileInput} 
      />
      
      {file && (
        <div style={styles.fileInfo}>
          <p style={styles.fileName}>Selected File: {file.name}</p>
          <p style={styles.fileHint}>Data will be stored in: students/email/placementInternship/placement & students/email/placementInternship/internship</p>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        style={{ 
          ...styles.uploadBtn, 
          ...(file && !isUploading ? {} : styles.disabledBtn),
          ...(isUploading ? styles.uploadingBtn : {})
        }}
        disabled={!file || isUploading}
      >
        {isUploading ? (
          <>
            <span style={styles.spinner}></span>
            Uploading...
          </>
        ) : (
          'Upload Student Data'
        )}
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '10px',
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    margin: '1rem auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  heading: {
    marginBottom: '0.5rem',
    fontSize: '1.3rem',
    color: '#1b5e20',
    textAlign: 'center'
  },
  templateSection: {
    textAlign: 'center',
    marginBottom: '1rem'
  },
  downloadTemplateBtn: {
    background: '#1b5e20',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  templateHint: {
    fontSize: '0.8rem',
    color: '#555',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },
  fileInput: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    cursor: 'pointer'
  },
  fileInfo: {
    background: '#f8f9fa',
    padding: '0.8rem',
    borderRadius: '6px',
    border: '1px solid #dee2e6'
  },
  fileName: {
    fontSize: '0.9rem',
    color: '#333',
    fontWeight: 'bold',
    marginBottom: '0.3rem'
  },
  fileHint: {
    fontSize: '0.8rem',
    color: '#666',
    fontFamily: 'monospace'
  },
  uploadBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    background: '#1b5e20',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  uploadingBtn: {
    opacity: 0.8
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: 'not-allowed'
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

export default StudentPlacementUpload;