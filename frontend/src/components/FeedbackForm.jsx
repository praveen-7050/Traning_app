import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";

function FeedbackForm() {
  const { nomineeId } = useParams();
  const [nomineeInfo, setNomineeInfo] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNomineeInfo();
  }, [nomineeId]);

  const fetchNomineeInfo = async () => {
    try {
      const res = await API.get(`/feedback/${nomineeId}/info/`);
      setNomineeInfo(res.data);
      if (res.data.has_feedback) {
        setSubmitted(true);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error || "Feedback is not available for this nominee.");
      } else {
        setError("Unable to load feedback form. Invalid link.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      await API.post(`/feedback/${nomineeId}/`, {
        rating,
        comments,
        suggestions,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="feedback-wrapper">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="feedback-wrapper">
        <div className="feedback-card text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h4 className="fw-bold mb-2">Thank You!</h4>
          <p className="text-muted">Your feedback has been submitted successfully. We appreciate your time!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-wrapper">
      <div className="feedback-card">
        <div className="text-center mb-4">
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📝</div>
          <h4 className="fw-bold">Training Feedback</h4>
          {nomineeInfo && (
            <>
              <p className="text-muted mb-0">{nomineeInfo.event_title}</p>
              <small className="text-muted">Hi {nomineeInfo.nominee_name}, please share your experience.</small>
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-danger py-2">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-4">
            <label className="form-label d-block text-center">Rating *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`btn btn-link p-0 star ${star <= (hoverRating || rating) ? "active" : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ fontSize: "2rem", color: star <= (hoverRating || rating) ? "#f39c12" : "#ddd", textDecoration: "none", border: "none", background: "none" }}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="text-center text-muted small">{rating > 0 && ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}</div>
          </div>

          {/* Comments */}
          <div className="mb-3">
            <label className="form-label">Comments</label>
            <textarea className="form-control" rows="3" placeholder="Share your thoughts about the training..." value={comments} onChange={(e) => setComments(e.target.value)} />
          </div>

          {/* Suggestions */}
          <div className="mb-4">
            <label className="form-label">Suggestions</label>
            <textarea className="form-control" rows="3" placeholder="Any suggestions for improvement..." value={suggestions} onChange={(e) => setSuggestions(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>Submitting...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FeedbackForm;
