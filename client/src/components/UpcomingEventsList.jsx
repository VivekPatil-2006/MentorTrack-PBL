import { useEffect, useState } from 'react';

function UpcomingEventsList() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/upcoming-events');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.data);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div style={styles.listCard}>
      <h3 style={styles.title}>Upcoming Events/Sports</h3>
      {error && <p style={styles.error}>{error}</p>}
      {events.length === 0 && <p>No upcoming events.</p>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Type</th>
            <th>Date</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, index) => (
            <tr key={index}>
              <td>{e.eventName}</td>
              <td>{e.type}</td>
              <td>{e.date}</td>
              <td>{e.description}</td>
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

export default UpcomingEventsList;
