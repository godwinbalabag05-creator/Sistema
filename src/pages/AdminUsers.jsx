import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import AdminTabs from "../components/AdminTabs";
import ListSkeleton from "../components/ListSkeleton";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { confirmDialog } from "../lib/confirm";

const ROLES = [
  { value: "user", label: "Owner" },
  { value: "mechanic", label: "Mechanic" },
  { value: "admin", label: "Admin" },
];

function roleLabel(value) {
  return ROLES.find((role) => role.value === value)?.label ?? value;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

function AdminUsers() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let ignore = false;

    supabase
      .from("users")
      .select("id, full_name, email, phone, role, created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (ignore) return;
        if (loadError) setError(loadError.message);
        setUsers(data ?? []);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Counts shown in the details window
  useEffect(() => {
    if (!selected) return undefined;

    let ignore = false;
    setCounts(null);

    Promise.all([
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", selected.id),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", selected.id),
    ]).then(([vehicles, bookings]) => {
      if (ignore) return;
      setCounts({ vehicles: vehicles.count ?? 0, bookings: bookings.count ?? 0 });
    });

    return () => {
      ignore = true;
    };
  }, [selected]);

  const visible = useMemo(() => {
    const query = term.trim().toLowerCase();

    return users.filter((person) => {
      const matchesRole = !roleFilter || person.role === roleFilter;

      const matchesText =
        !query ||
        (person.full_name ?? "").toLowerCase().includes(query) ||
        (person.email ?? "").toLowerCase().includes(query);

      return matchesRole && matchesText;
    });
  }, [users, term, roleFilter]);

  async function changeRole(target, role) {
    if (role === target.role) return;

    const ok = await confirmDialog({
      title: "Change this user's role?",
      message:
        `${target.full_name || target.email} will change from ${roleLabel(target.role)} to ${roleLabel(role)}.` +
        (role === "admin"
          ? " Admins can see and manage everything in E-Kaniko."
          : ""),
      confirmLabel: "Change role",
      danger: role === "admin",
    });

    if (!ok) return;

    setError("");

    const { data, error: updateError } = await supabase
      .from("users")
      .update({ role })
      .eq("id", target.id)
      .select("id");

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("The role was not changed. You may not have permission.");
      return;
    }

    setUsers((current) =>
      current.map((person) =>
        person.id === target.id ? { ...person, role } : person
      )
    );
  }

  function openDetails(person) {
    setSelected(person);
    setDetailsOpen(true);
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Users</h1>
            <p>Everyone who has an E-Kaniko account, and what they can do.</p>
          </div>
        </div>

        <AdminTabs />

        <div className="filters">
          <div>
            <label htmlFor="user-search">Search</label>
            <input
              id="user-search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Name or email"
            />
          </div>

          <div>
            <label htmlFor="role-filter">Role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading && <ListSkeleton />}

        {!loading && visible.length === 0 && (
          <div className="empty-state">
            <h2>No users found</h2>
            <p>Try a different search or role.</p>
          </div>
        )}

        {!loading && visible.length > 0 && (
          <>
            <p className="table-count">
              Showing {visible.length} of {users.length} users
            </p>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visible.map((person) => {
                    const isMe = person.id === me?.id;

                    return (
                      <tr key={person.id}>
                        <td data-label="User">
                          <div>
                            <strong>{person.full_name || "No name"}</strong>
                            {isMe && <span className="you-tag">You</span>}
                            <span className="cell-sub">{person.email}</span>
                          </div>
                        </td>

                        <td data-label="Role">
                          <select
                            className="role-select"
                            value={person.role}
                            disabled={isMe}
                            title={
                              isMe ? "You can't change your own role" : undefined
                            }
                            aria-label={`Role for ${person.full_name || person.email}`}
                            onChange={(e) => changeRole(person, e.target.value)}
                          >
                            {ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td data-label="Joined">
                          {formatDate(person.created_at)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => openDetails(person)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selected?.full_name || "User details"}
        size="sm"
        footer={
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDetailsOpen(false)}
          >
            Close
          </button>
        }
      >
        {selected && (
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{selected.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{selected.phone || "Not provided"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel(selected.role)}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(selected.created_at)}</dd>
            </div>
            <div>
              <dt>Vehicles</dt>
              <dd>{counts ? counts.vehicles : "Loading..."}</dd>
            </div>
            <div>
              <dt>Bookings</dt>
              <dd>{counts ? counts.bookings : "Loading..."}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
}

export default AdminUsers;