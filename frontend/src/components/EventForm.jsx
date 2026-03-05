import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';

function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}/`);
      setForm({
        title: res.data.title,
        description: res.data.description,
        date: res.data.date,
        time: res.data.time,
        venue: res.data.venue,
      });
    } catch {
      setError('Failed to load event.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.date || !form.time || !form.venue) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await API.put(`/events/${id}/`, form);
      } else {
        await API.post('/events/', form);
      }
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container content-area">
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card-custom">
            <div className="card-header">
              <i className={`bi ${isEdit ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
              {isEdit ? 'Edit Event' : 'Create New Event'}
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger py-2">
                  <i className="bi bi-exclamation-circle me-2"></i>{error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Advanced React Training"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of the training event..."
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Time *</label>
                    <input
                      type="time"
                      className="form-control"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label">Venue *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    placeholder="e.g. Conference Room A, Building 2"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                    ) : (
                      <><i className="bi bi-check-lg me-1"></i>{isEdit ? 'Update Event' : 'Create Event'}</>
                    )}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/events')}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventForm;
