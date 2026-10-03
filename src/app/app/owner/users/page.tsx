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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5] dark:border-[#223042]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl font-bold text-[#0B1320] dark:text-[#FAF8F5] tracking-tight">
              Executive User Governance & Roles
            </h1>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded bg-[#921111]/10 text-[#921111] dark:text-[#e05252] border border-[#921111]/25 font-bold">
              RBAC CONTROLLER
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
            Server-enforced role assignments, user lifecycle status, and security audit trail integration.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(!isCreateOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#921111] hover:bg-[#7A0E0E] text-white text-xs font-serif uppercase tracking-wider font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision New User</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-[#921111]/10 text-[#921111] dark:text-[#e05252] border border-[#921111]/25"
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
        <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="font-serif text-base font-bold text-[#0B1320] dark:text-[#FAF8F5] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            Provision System User with Assigned Privilege Role
          </h3>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-serif font-bold text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block font-serif font-bold text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@championsclub.in"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block font-serif font-bold text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs font-semibold text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r} ({ROLE_METADATA[r].label})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-serif font-bold text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial password"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div>
              <label className="block font-serif font-bold text-[10px] uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-lg bg-[#921111] hover:bg-[#7A0E0E] text-white font-serif uppercase tracking-wider text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
              >
                {submitting ? "Provisioning..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="py-2 px-3 rounded-lg border border-[#E5DFD5] dark:border-[#223042] text-stone-600 dark:text-stone-300 hover:bg-[#FAF8F5] dark:hover:bg-[#162232] font-serif uppercase tracking-wider text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs text-[#0B1320] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-xs font-semibold text-[#0B1320] dark:text-[#FAF8F5]"
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
            className="p-2 rounded-lg border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] hover:bg-[#E5DFD5] text-stone-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0F1923] border border-[#E5DFD5] dark:border-[#223042] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] dark:bg-[#162232] text-stone-500 font-mono text-[10px] uppercase tracking-wider border-b border-[#E5DFD5] dark:border-[#223042]">
              <tr>
                <th className="p-3.5">User & Contact</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Linked Profile</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD5] dark:divide-[#223042] font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-mono italic">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const meta = ROLE_METADATA[u.role as Role];
                  return (
                    <tr key={u.id} className="hover:bg-[#FAF8F5] dark:hover:bg-[#162232]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-serif font-bold text-sm text-[#0B1320] dark:text-[#FAF8F5]">{u.name}</div>
                        <div className="text-stone-400 font-mono text-[11px] mt-0.5">{u.email}</div>
                        {u.phone && <div className="text-stone-400 font-mono text-[10px]">{u.phone}</div>}
                      </td>

                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                          className="font-mono font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-[#E5DFD5] dark:border-[#223042] bg-[#FAF8F5] dark:bg-[#162232] text-stone-700 dark:text-stone-300 cursor-pointer focus:outline-none focus:border-[#C5A059]"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3.5">
                        {u.member ? (
                          <div>
                            <span className="font-mono font-bold text-[#C5A059]">{u.member.memberId}</span>
                            <span className="block text-[10px] text-stone-400 font-serif">
                              {u.member.memberships?.[0]?.plan?.name || u.member.status}
                            </span>
                          </div>
                        ) : u.employee ? (
                          <div>
                            <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{u.employee.employeeCode}</span>
                            <span className="block text-[10px] text-stone-400 font-serif">Staff Employee</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px] font-mono">—</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded font-mono font-bold text-[10px] uppercase tracking-wider border ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-[#921111]/10 text-[#921111] border-[#921111]/25 dark:text-[#e05252]"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>

                      <td className="p-3.5 text-stone-500 font-mono text-[11px]">{formatDateTime(u.createdAt)}</td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-serif uppercase tracking-wider font-bold transition-colors ${
                            u.isActive
                              ? "text-[#921111] hover:bg-[#921111]/10"
                              : "text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
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
