import { Link, useLocation } from 'react-router-dom';

function Navbar({ username, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container">
        <Link className="navbar-brand" to="/dashboard">
          <i className="bi bi-mortarboard-fill"></i>
          Training Manager
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          style={{ border: '1px solid rgba(255,255,255,0.3)' }}
        >
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                <i className="bi bi-grid-1x2-fill me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/events')}`} to="/events">
                <i className="bi bi-calendar-event me-1"></i> Events
              </Link>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-3">
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
              <i className="bi bi-person-circle me-1"></i> {username}
            </span>
            <button className="btn btn-logout" onClick={onLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
