"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "../../lib/clientConfig";
import { useAuth } from "../../components/AuthProvider";

const roles = ["ADMIN", "BILLER", "CODER"];

export default function UsersPage() {
  const { can } = useAuth();
  const canManage = can("manage_users");
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", role: "BILLER", password: "" });
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`${BASE_PATH}/api/users`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    if (!canManage) {
      setMessage("Admin only.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMessage("User created.");
      setForm({ email: "", name: "", role: "BILLER", password: "" });
      load();
    } else {
      const data = await res.json();
      setMessage(data.error || "Unable to create user.");
    }
  }

  async function updateUser(user, idx) {
    if (!canManage) {
      setMessage("Admin only.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (res.ok) {
      setMessage("User updated.");
      load();
    } else {
      const data = await res.json();
      setMessage(data.error || "Unable to update user.");
    }
  }

  async function deleteUser(id) {
    if (!canManage) {
      setMessage("Admin only.");
      return;
    }
    const res = await fetch(`${BASE_PATH}/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("User deleted.");
      load();
    } else {
      const data = await res.json();
      setMessage(data.error || "Unable to delete user.");
    }
  }

  function updateRow(idx, field, value) {
    setUsers((prev) => prev.map((u, i) => (i === idx ? { ...u, [field]: value } : u)));
  }

  if (!canManage) {
    return <div className="text-sm text-slate-500">Admin access required.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">Create and manage team access</p>
      </div>

      {message && <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2">{message}</div>}

      <form onSubmit={createUser} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input className="input" type="password" placeholder="Temp password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary">
          Create User
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">New Password</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <input className="input" value={u.email || ""} onChange={(e) => updateRow(idx, "email", e.target.value)} />
                </td>
                <td className="px-4 py-2">
                  <input className="input" value={u.name || ""} onChange={(e) => updateRow(idx, "name", e.target.value)} />
                </td>
                <td className="px-4 py-2">
                  <select className="input" value={u.role} onChange={(e) => updateRow(idx, "role", e.target.value)}>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    className="input"
                    type="password"
                    placeholder="Optional"
                    value={u.password || ""}
                    onChange={(e) => updateRow(idx, "password", e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="btn btn-secondary" onClick={() => updateUser(u, idx)}>
                    Save
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteUser(u.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
