import { useEffect, useState } from 'react';

function UpcomingCompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/upcoming-companies');
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.data);
      } else {
        setError(data.error || 'Failed to fetch companies');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div style={styles.listCard}>
      <h3 style={styles.title}>Upcoming Companies</h3>
      {error && <p style={styles.error}>{error}</p>}
      {companies.length === 0 && <p>No upcoming companies.</p>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Criteria</th>
            <th>Type</th>
            <th>Date</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c, index) => (
            <tr key={index}>
              <td>{c.companyName}</td>
              <td>{c.criteria}</td>
              <td>{c.type}</td>
              <td>{c.date}</td>
              <td>{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  listCard: { background: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)', marginTop: '1rem', overflowX: 'auto' },
  title: { fontSize: '1.2rem', fontWeight: '600', color: '#1b5e20', marginBottom: '0.5rem' },
  error: { color: '#b71c1c', marginBottom: '0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' }
};

export default UpcomingCompaniesList;
