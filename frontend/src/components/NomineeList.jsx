import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";

function NomineeList() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, nomineesRes] = await Promise.all([API.get(`/events/${eventId}/`), API.get(`/events/${eventId}/nominees/`)]);
      setEvent(eventRes.data);
      setNominees(nomineesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (nomineeId) => {
    setActionLoading({ ...actionLoading, [nomineeId]: true });
    try {
      const res = await API.put(`/nominee/${nomineeId}/attend/`);
      setNominees(nominees.map((n) => (n.id === nomineeId ? res.data : n)));
      showMessage("success", "Nominee marked as attended.");
    } catch (err) {
      showMessage("danger", err.response?.data?.error || "Failed to mark attendance.");
    } finally {
      setActionLoading({ ...actionLoading, [nomineeId]: false });
    }
  };

  const deleteNominee = async (nomineeId) => {
    if (!window.confirm("Are you sure you want to delete this nominee?")) return;
    setActionLoading({ ...actionLoading, [nomineeId]: true });
    try {
      await API.delete(`/nominees/${nomineeId}/`);
      setNominees(nominees.filter((n) => n.id !== nomineeId));
      fetchData(); // Refresh event data to update counts
      showMessage("success", "Nominee deleted successfully.");
    } catch (err) {
      showMessage("danger", err.response?.data?.error || "Failed to delete nominee.");
    } finally {
      setActionLoading({ ...actionLoading, [nomineeId]: false });
    }
  };

  const sendFeedbackEmails = async () => {
    setActionLoading({ ...actionLoading, feedback: true });
    try {
      const res = await API.post(`/events/${eventId}/send-feedback/`);
      showMessage("success", res.data.message);
    } catch (err) {
      showMessage("danger", err.response?.data?.error || "Failed to send feedback emails.");
    } finally {
      setActionLoading({ ...actionLoading, feedback: false });
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await API.get(`/event/${eventId}/feedback/download/`, {
        responseType: 'blob',
      });
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `feedback_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showMessage('success', 'CSV downloaded successfully.');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to download CSV.';
      showMessage('danger', errorMsg);
      console.error('Download error:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const getStatusBadge = (status) => {
    const cls = status.toLowerCase();
    return <span className={`badge-status badge-${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  const acceptedNominees = nominees.filter((n) => n.status === "Accepted");
  const attendedNominees = nominees.filter((n) => n.status === "Attended");

  return (
    <div className="container content-area">
      <div className="page-header">
        <div>
          <h4>
            <i className="bi bi-people-fill me-2"></i>Nominees
          </h4>
          {event && <small className="text-muted">{event.title}</small>}
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/events/${eventId}/nominees/add`} className="btn btn-primary btn-sm">
            <i className="bi bi-person-plus me-1"></i> Add Nominees
          </Link>
          {attendedNominees.length > 0 && (
            <>
              <button className="btn btn-info btn-sm text-white" onClick={sendFeedbackEmails} disabled={actionLoading.feedback}>
                {actionLoading.feedback ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-envelope me-1"></i> Send Feedback
                  </>
                )}
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={downloadCSV}>
                <i className="bi bi-download me-1"></i> Download CSV
              </button>
            </>
          )}
          <Link to="/events" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back
          </Link>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} py-2`}>
          <i className={`bi ${message.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2`}></i>
          {message.text}
        </div>
      )}

      {nominees.length === 0 ? (
        <div className="card-custom">
          <div className="empty-state">
            <i className="bi bi-person-x"></i>
            <p>No nominees for this event yet.</p>
            <Link to={`/events/${eventId}/nominees/add`} className="btn btn-primary mt-2">
              Add Nominees
            </Link>
          </div>
        </div>
      ) : (
        <div className="card-custom">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Feedback</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nominees.map((n, i) => (
                    <tr key={n.id}>
                      <td>{i + 1}</td>
                      <td className="fw-semibold">{n.name}</td>
                      <td>{n.email}</td>
                      <td>{n.employee_id}</td>
                      <td>{n.department}</td>
                      <td>{getStatusBadge(n.status)}</td>
                      <td>
                        {n.feedback ? (
                          <span title={`Rating: ${n.feedback.rating}/5\nComments: ${n.feedback.comments}\nSuggestions: ${n.feedback.suggestions}`}>
                            {"⭐".repeat(n.feedback.rating)} <small className="text-muted">({n.feedback.rating}/5)</small>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {n.status === "Accepted" && (
                            <button className="btn btn-success btn-sm" onClick={() => markAttendance(n.id)} disabled={actionLoading[n.id]}>
                              {actionLoading[n.id] ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <>
                                  <i className="bi bi-check2 me-1"></i>Mark Attended
                                </>
                              )}
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => deleteNominee(n.id)} disabled={actionLoading[n.id]}>
                            {actionLoading[n.id] ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <>
                                <i className="bi bi-trash me-1"></i>Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NomineeList;
