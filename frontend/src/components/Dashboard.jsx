import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nomineesLoading, setNomineesLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events/');
      setEvents(res.data);
      if (res.data.length > 0) {
        selectEvent(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (event) => {
    setSelectedEvent(event);
    setNomineesLoading(true);
    try {
      const res = await API.get(`/events/${event.id}/nominees/`);
      setNominees(res.data);
    } catch (err) {
      console.error('Error fetching nominees:', err);
    } finally {
      setNomineesLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const cls = status.toLowerCase();
    return <span className={`badge-status badge-${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="spinner-wrapper"><div className="spinner-border text-primary" role="status"></div></div>
    );
  }

  return (
    <div className="container content-area">
      <div className="page-header">
        <h4><i className="bi bi-grid-1x2-fill me-2"></i>Dashboard</h4>
        <Link to="/events/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card-custom">
          <div className="empty-state">
            <i className="bi bi-calendar-x"></i>
            <p>No events yet. Create your first training event!</p>
            <Link to="/events/new" className="btn btn-primary mt-2">Create Event</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Event Tabs */}
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  className={`btn btn-sm ${selectedEvent?.id === event.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => selectEvent(event)}
                >
                  {event.title}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          {selectedEvent && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-6 col-md">
                  <div className="stat-card stat-total">
                    <div className="stat-icon"><i className="bi bi-people-fill"></i></div>
                    <div className="stat-number">{selectedEvent.total_nominees}</div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
                <div className="col-6 col-md">
                  <div className="stat-card stat-accepted">
                    <div className="stat-icon"><i className="bi bi-check-circle-fill"></i></div>
                    <div className="stat-number">{selectedEvent.accepted_count}</div>
                    <div className="stat-label">Accepted</div>
                  </div>
                </div>
                <div className="col-6 col-md">
                  <div className="stat-card stat-rejected">
                    <div className="stat-icon"><i className="bi bi-x-circle-fill"></i></div>
                    <div className="stat-number">{selectedEvent.rejected_count}</div>
                    <div className="stat-label">Rejected</div>
                  </div>
                </div>
                <div className="col-6 col-md">
                  <div className="stat-card stat-pending">
                    <div className="stat-icon"><i className="bi bi-hourglass-split"></i></div>
                    <div className="stat-number">{selectedEvent.pending_count}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>
                <div className="col-6 col-md">
                  <div className="stat-card stat-attended">
                    <div className="stat-icon"><i className="bi bi-person-check-fill"></i></div>
                    <div className="stat-number">{selectedEvent.attended_count}</div>
                    <div className="stat-label">Attended</div>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="card-custom mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><i className="bi bi-info-circle me-2"></i>{selectedEvent.title}</span>
                  <div className="d-flex gap-2">
                    <Link to={`/events/${selectedEvent.id}/nominees/add`} className="btn btn-primary btn-sm">
                      <i className="bi bi-person-plus me-1"></i> Add Nominees
                    </Link>
                    <Link to={`/events/${selectedEvent.id}/nominees`} className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-eye me-1"></i> Manage
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <small className="text-muted">Date</small>
                      <div className="fw-semibold">{selectedEvent.date}</div>
                    </div>
                    <div className="col-md-4 mb-2">
                      <small className="text-muted">Time</small>
                      <div className="fw-semibold">{selectedEvent.time}</div>
                    </div>
                    <div className="col-md-4 mb-2">
                      <small className="text-muted">Venue</small>
                      <div className="fw-semibold">{selectedEvent.venue}</div>
                    </div>
                  </div>
                  {selectedEvent.description && (
                    <div className="mt-2">
                      <small className="text-muted">Description</small>
                      <div>{selectedEvent.description}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-custom">
                <div className="card-header">
                  <i className="bi bi-people me-2"></i>Nominees ({nominees.length})
                </div>
                <div className="card-body p-0">
                  {nomineesLoading ? (
                    <div className="spinner-wrapper"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                  ) : nominees.length === 0 ? (
                    <div className="empty-state py-4">
                      <i className="bi bi-person-x" style={{ fontSize: '2rem' }}></i>
                      <p className="mt-2 mb-0">No nominees yet</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nominees.map((n) => (
                            <tr key={n.id}>
                              <td className="fw-semibold">{n.name}</td>
                              <td>{n.email}</td>
                              <td>{n.department}</td>
                              <td>{getStatusBadge(n.status)}</td>
                              <td>
                                {n.feedback ? (
                                  <span title={`Comments: ${n.feedback.comments}`}>
                                    {'⭐'.repeat(n.feedback.rating)}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
