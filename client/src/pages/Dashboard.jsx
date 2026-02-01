import { useState } from 'react';
import FileUpload from '../components/FileUpload.jsx';
import PlacementUpload from '../components/PlacementUpload.jsx';
import StudentPlacementUpload from '../components/StudentPlacementUpload.jsx';
import UpcomingCompany from '../components/UpcomingCompany.jsx';
import UpcomingEvent from '../components/UpcomingEvent.jsx';
import UpcomingCompaniesList from '../components/UpcomingCompaniesList.jsx';
import UpcomingEventsList from '../components/UpcomingEventsList.jsx';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('uploads');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [examType, setExamType] = useState('UT1');
  const [uploadType, setUploadType] = useState('marks');
  const [showPassword, setShowPassword] = useState(false);

  const user = {
    name: 'Vivek Patil',
    email: 'vivekjpatil006@gmail.com',
    department: 'Computer Science',
    password: 'vivek$12',
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <h1 style={styles.navTitle}>MentorTrack</h1>
      </nav>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {['uploads', 'upcoming', 'profile'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={
              activeTab === tab
                ? { ...styles.tab, ...styles.activeTab }
                : styles.tab
            }
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Uploads */}
        {activeTab === 'uploads' && (
          <div style={styles.flexWrap}>
            <div style={styles.card}>
              <label style={styles.label}>Upload Type:</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                style={styles.select}
              >
                <option value="marks">Exam Marks</option>
                <option value="placement">Placement Report</option>
                <option value="studentPlacement">
                  Student Placement & Internship
                </option>
              </select>

              {uploadType === 'marks' && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={styles.cardTitle}>Exam Marks Upload</h3>
                  <label>Exam Type:</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    style={styles.select}
                  >
                    <option value="UT1">UT1</option>
                    <option value="UT2">UT2</option>
                    <option value="UT3">UT3</option>
                    <option value="Insem">Insem</option>
                  </select>
                  <div style={{ marginTop: '0.5rem' }}>
                    <FileUpload
                      examType={examType}
                      setMessage={setMessage}
                      setError={setError}
                    />
                  </div>
                </div>
              )}

              {uploadType === 'placement' && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={styles.cardTitle}>Placement Report Upload</h3>
                  <PlacementUpload setMessage={setMessage} setError={setError} />
                </div>
              )}

              {uploadType === 'studentPlacement' && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={styles.cardTitle}>
                    Student Placement & Internship Upload
                  </h3>
                  <StudentPlacementUpload
                    technicianEmail={user.email}
                    setMessage={setMessage}
                    setError={setError}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Top row: Add Company & Add Event side by side */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '1 1 300px', minWidth: '280px', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={styles.cardTitle}>Add Upcoming Company</h2>
              <UpcomingCompany email={user.email} />
            </div>
            <div style={{ flex: '1 1 300px', minWidth: '280px', background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={styles.cardTitle}>Add Upcoming Event</h2>
              <UpcomingEvent email={user.email} />
            </div>
          </div>

          {/* Full-width Upcoming Companies */}
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
            <UpcomingCompaniesList />
          </div>

          {/* Full-width Upcoming Events */}
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
            <h2 style={styles.cardTitle}>Upcoming Events</h2>
            <UpcomingEventsList />
          </div>
        </div>
      )}


        {/* Profile */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={styles.profileCard}>
              <h2 style={styles.cardTitle}>Technician Profile</h2>
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Department:</strong> {user.department}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <strong>Password:</strong>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={user.password}
                  readOnly
                  style={styles.passwordInput}
                />
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </span>
              </div>
              <button style={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && <p style={styles.successMsg}>{message}</p>}
        {error && <p style={styles.errorMsg}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    background: '#f4f7fc',
    minHeight: '100vh',
    padding: '0 1rem',
    boxSizing: 'border-box',
  },
  navbar: {
    background: '#1b5e20',
    color: 'white',
    padding: '1rem 0',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navTitle: { fontSize: '2rem', fontWeight: 'bold' },
  tabsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    padding: '1rem 0',
    position: 'sticky',
    top: '64px',
    backgroundColor: '#f4f7fc',
    zIndex: 40,
    borderBottom: '1px solid #ddd',
    flexWrap: 'wrap',
  },
  tab: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#555',
    cursor: 'pointer',
    paddingBottom: '0.25rem',
  },
  activeTab: { color: '#1b5e20', borderBottom: '3px solid #1b5e20' },
  tabContent: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem',
    boxSizing: 'border-box',
  },
  flexWrap: { display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' },
  card: {
    flex: '1 1 300px',
    background: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  cardTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#1b5e20', marginBottom: '0.5rem' },
  label: { fontWeight: '600', color: '#1b5e20' },
  select: {
    marginLeft: '0.5rem',
    padding: '0.3rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    outline: 'none',
  },
  profileCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '1rem',
    boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '500px',
  },
  passwordInput: {
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '0.3rem 0.5rem',
    width: '120px',
  },
  logoutBtn: {
    marginTop: '1rem',
    padding: '0.5rem 1.2rem',
    backgroundColor: '#1b5e20',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  successMsg: {
    background: '#e6f4ea',
    color: '#1b5e20',
    padding: '0.5rem',
    borderRadius: '6px',
    marginTop: '1rem',
    textAlign: 'center',
  },
  errorMsg: {
    background: '#fdecea',
    color: '#b71c1c',
    padding: '0.5rem',
    borderRadius: '6px',
    marginTop: '1rem',
    textAlign: 'center',
  },
};

export default Dashboard;
