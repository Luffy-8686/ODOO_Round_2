"use client";

import React, { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/formatters";
import { ROLES, Role, ROLE_METADATA } from "@/lib/roles";
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  UserX,
} from "lucide-react";

export default function OwnerUsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Demo@1234");
  const [role, setRole] = useState<Role>("FRONT_DESK");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to load users: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      setMessage({ type: "success", text: `User ${name} created successfully with role ${role}!` });
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user role.");
      }

      setMessage({ type: "success", text: `Role updated to ${newRole}!` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !currentStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle status.");
      }

      setMessage({
        type: "success",
        text: `User account ${!currentStatus ? "activated" : "deactivated"} successfully.`,
      });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              User & Role Management
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-300 dark:border-purple-800">
              🛡️ RBAC CONTROLLER
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Server-enforced role assignments, user lifecycle status, and security audit log integration.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* CREATE USER ACCORDION */}
      {isCreateOpen && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-purple-600" />
            Provision System User with Assigned Role
          </h3>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@championsclub.in"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r} ({ROLE_METADATA[r].label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial password"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 disabled:opacity-50"
              >
                {submitting ? "Provisioning..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="ALL">All Roles ({users.length})</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r} ({users.filter((u) => u.role === r).length})
              </option>
            ))}
          </select>

          <button
            onClick={fetchUsers}
            title="Reload Users"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3">User & Contact</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Linked Profile</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const meta = ROLE_METADATA[u.role as Role];
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{u.name}</div>
                        <div className="text-slate-400 text-[11px]">{u.email}</div>
                        {u.phone && <div className="text-slate-400 text-[10px]">{u.phone}</div>}
                      </td>

                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className={`font-bold px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                            meta?.badgeClass || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        {u.member ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-600">{u.member.memberId}</span>
                            <span className="block text-[10px] text-slate-400">
                              {u.member.memberships?.[0]?.plan?.name || u.member.status}
                            </span>
                          </div>
                        ) : u.employee ? (
                          <div>
                            <span className="font-mono font-bold text-blue-600">{u.employee.employeeCode}</span>
                            <span className="block text-[10px] text-slate-400">Staff Employee</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="p-3 text-slate-400 text-[11px]">{formatDateTime(u.createdAt)}</td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            u.isActive
                              ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                        >
                          {u.isActive ? "Suspend" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
