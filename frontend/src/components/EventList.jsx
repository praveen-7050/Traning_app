import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events/');
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await API.delete(`/events/${id}/`);
      setEvents(events.filter((e) => e.id !== id));
      alert('Event deleted successfully.');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete event.';
      alert(errorMsg);
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return <div className="spinner-wrapper"><div className="spinner-border text-primary"></div></div>;
  }

  return (
    <div className="container content-area">
      <div className="page-header">
        <h4><i className="bi bi-calendar-event me-2"></i>Training Events</h4>
        <Link to="/events/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card-custom">
          <div className="empty-state">
            <i className="bi bi-calendar-x"></i>
            <p>No events created yet.</p>
            <Link to="/events/new" className="btn btn-primary mt-2">Create Event</Link>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {events.map((event) => (
            <div key={event.id} className="col-md-6 col-lg-4">
              <div className="card-custom h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="fw-bold mb-2">{event.title}</h5>
                  <p className="text-muted small mb-3" style={{ minHeight: '2.5rem' }}>
                    {event.description ? (event.description.length > 80 ? event.description.substring(0, 80) + '...' : event.description) : 'No description'}
                  </p>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-calendar3 me-2 text-muted"></i>
                      <small>{event.date}</small>
                    </div>
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-clock me-2 text-muted"></i>
                      <small>{event.time}</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-geo-alt me-2 text-muted"></i>
                      <small>{event.venue}</small>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    <span className="badge bg-secondary">{event.total_nominees} Total</span>
                    <span className="badge bg-success">{event.accepted_count} Accepted</span>
                    <span className="badge bg-warning text-dark">{event.pending_count} Pending</span>
                    <span className="badge bg-info">{event.attended_count} Attended</span>
                  </div>
                  <div className="mt-auto d-flex flex-wrap gap-2">
                    <Link to={`/events/${event.id}/nominees`} className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-people me-1"></i>Nominees
                    </Link>
                    <Link to={`/events/${event.id}/edit`} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-pencil me-1"></i>Edit
                    </Link>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(event.id, event.title)}>
                      <i className="bi bi-trash me-1"></i>Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventList;
