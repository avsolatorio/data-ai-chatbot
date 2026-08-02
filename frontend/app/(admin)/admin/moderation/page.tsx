"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  id: string;
  email: string;
  type: string;
  name: string | null;
  chatCount: number;
  createdAt: string | null;
  disabled: boolean;
}

interface AdminChat {
  id: string;
  title: string;
  userId: string;
  userEmail: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

type Tab = "users" | "chats";

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Moderation</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        <TabButton
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        >
          Users
        </TabButton>
        <TabButton
          active={activeTab === "chats"}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </TabButton>
      </div>

      {activeTab === "users" ? <UsersPanel /> : <ChatsPanel />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "text-white border-b-2 border-blue-500"
          : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("page", String(page));
      params.set("pageSize", String(limit));
      const res = await fetch(`/api/admin/moderation/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleDisabled = async (userId: string, currentDisabled: boolean) => {
    const newDisabled = !currentDisabled;
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, disabled: newDisabled } : u
      )
    );
    try {
      const res = await fetch(
        `/api/admin/moderation/users/${userId}/disable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disabled: newDisabled }),
        }
      );
      if (!res.ok) throw new Error("Failed to update user");
      const data = await res.json();
      // Confirm with API response
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, disabled: data.disabled } : u
        )
      );
    } catch (err) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, disabled: currentDisabled } : u
        )
      );
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-900/30 border border-red-800 rounded-md text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search by email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-md px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
      />

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Chats</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-800/50 text-zinc-300"
                >
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        user.type === "regular"
                          ? "bg-blue-900/50 text-blue-300"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {user.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.chatCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        user.disabled
                          ? "bg-red-900/50 text-red-300"
                          : "bg-green-900/50 text-green-300"
                      }`}
                    >
                      {user.disabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleDisabled(user.id, user.disabled)}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        user.disabled
                          ? "bg-green-800 text-green-200 hover:bg-green-700"
                          : "bg-red-800 text-red-200 hover:bg-red-700"
                      }`}
                    >
                      {user.disabled ? "Enable" : "Disable"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ChatsPanel() {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  const fetchChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("page", String(page));
      params.set("pageSize", String(limit));
      const res = await fetch(`/api/admin/moderation/chats?${params}`);
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      setChats(data.chats);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const deleteChat = async (chatId: string) => {
    if (!confirm("Delete this chat? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/moderation/chats/${chatId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete chat");
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete chat"
      );
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-900/30 border border-red-800 rounded-md text-sm text-red-300">
          {error}
        </div>
      )}

      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-md px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Messages</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  Loading...
                </td>
              </tr>
            ) : chats.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No chats found
                </td>
              </tr>
            ) : (
              chats.map((chat) => (
                <tr
                  key={chat.id}
                  className="border-b border-zinc-800/50 text-zinc-300"
                >
                  <td className="px-4 py-3 max-w-xs truncate">
                    {chat.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {chat.userEmail}
                  </td>
                  <td className="px-4 py-3">{chat.messageCount}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {chat.createdAt
                      ? new Date(chat.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => deleteChat(chat.id)}
                      className="text-xs px-3 py-1 rounded bg-red-800 text-red-200 hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
