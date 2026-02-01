import { useState } from 'react';

function UpcomingEvent({ email }) {
  const [eventName, setEventName] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    if (!eventName || !date) {
      setError('Event Name and Date are required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/upcoming-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, type, date, description, email })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setEventName(''); setType(''); setDate(''); setDescription('');
      } else {
        setError(data.error || 'Failed to add event');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div style={styles.formCard}>
      <h3 style={styles.title}>Add Upcoming Event/Sports</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="text" placeholder="Event Name" value={eventName} onChange={e => setEventName(e.target.value)} style={styles.input} required />
        <input type="text" placeholder="Type (e.g., Sports, Cultural)" value={type} onChange={e => setType(e.target.value)} style={styles.input} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} required />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={styles.textarea} />
        <button type="submit" style={styles.button}>Add Event</button>
      </form>
      {message && <p style={styles.success}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  formCard: { background: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 3px 8px rgba(0,0,0,0.1)', marginBottom: '1rem' },
  title: { fontSize: '1.2rem', fontWeight: '600', color: '#1b5e20', marginBottom: '0.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  input: { padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' },
  textarea: { padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' },
  button: { padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#1b5e20', color: '#fff', cursor: 'pointer' },
  success: { color: '#1b5e20', marginTop: '0.5rem' },
  error: { color: '#b71c1c', marginTop: '0.5rem' }
};

export default UpcomingEvent;
