import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        E-Kaniko
      </Link>

      <div className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/diagnosis">AI Diagnosis</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;