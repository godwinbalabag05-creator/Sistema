import { NavLink } from "react-router-dom";

function AdminTabs() {
  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      <NavLink to="/admin" end>Overview</NavLink>
      <NavLink to="/admin/users">Users</NavLink>
      <NavLink to="/admin/shops">Shops</NavLink>
    </nav>
  );
}

export default AdminTabs;