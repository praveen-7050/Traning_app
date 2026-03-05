import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

function NomineeForm() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const emptyNominee = { name: "", email: "", employee_id: "", department: "" };
  const [nominees, setNominees] = useState([{ ...emptyNominee }]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (index, e) => {
    const updated = [...nominees];
    updated[index][e.target.name] = e.target.value;
    setNominees(updated);
  };

  const addRow = () => {
    setNominees([...nominees, { ...emptyNominee }]);
  };

  const removeRow = (index) => {
    if (nominees.length === 1) return;
    setNominees(nominees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    for (let i = 0; i < nominees.length; i++) {
      const n = nominees[i];
      if (!n.name || !n.email || !n.employee_id || !n.department) {
        setError(`Please fill in all fields for nominee #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await API.post(`/events/${eventId}/nominees/`, nominees);
      const messages = [];
      if (res.data.created?.length) {
        messages.push(`${res.data.created.length} nominee(s) added successfully.`);
      }
      if (res.data.errors?.length) {
        // build human‑readable list of problems
        const errs = res.data.errors
          .map((e) => {
            if (e.email) return e.email;
            return JSON.stringify(e);
          })
          .join(" \n");
        setError(errs);
      }
      if (messages.length && !res.data.errors) {
        setSuccess(messages.join(" ")); // pure success
      } else if (messages.length) {
        setSuccess(messages.join(" ") + " (see warnings above)");
      }
      setNominees([{ ...emptyNominee }]);
      setTimeout(() => navigate(`/events/${eventId}/nominees`), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add nominees.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container content-area">
      <div className="page-header">
        <h4>
          <i className="bi bi-person-plus-fill me-2"></i>Add Nominees
        </h4>
        <button className="btn btn-outline-secondary" onClick={() => navigate(`/events/${eventId}/nominees`)}>
          <i className="bi bi-arrow-left me-1"></i> Back to Nominees
        </button>
      </div>

      <div className="card-custom">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger py-2">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success py-2">
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {nominees.map((nominee, index) => (
              <div key={index} className="border rounded p-3 mb-3" style={{ background: "#fafbfd" }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="text-muted small">Nominee #{index + 1}</strong>
                  {nominees.length > 1 && (
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeRow(index)}>
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
                <div className="row g-2">
                  <div className="col-md-3">
                    <input type="text" className="form-control" name="name" placeholder="Full Name" value={nominee.name} onChange={(e) => handleChange(index, e)} />
                  </div>
                  <div className="col-md-3">
                    <input type="email" className="form-control" name="email" placeholder="Email" value={nominee.email} onChange={(e) => handleChange(index, e)} />
                  </div>
                  <div className="col-md-3">
                    <input type="text" className="form-control" name="employee_id" placeholder="Employee ID" value={nominee.employee_id} onChange={(e) => handleChange(index, e)} />
                  </div>
                  <div className="col-md-3">
                    <input type="text" className="form-control" name="department" placeholder="Department" value={nominee.department} onChange={(e) => handleChange(index, e)} />
                  </div>
                </div>
              </div>
            ))}

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-primary" onClick={addRow}>
                <i className="bi bi-plus-lg me-1"></i> Add Another Nominee
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-1"></i> Submit & Send Invitations
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NomineeForm;
