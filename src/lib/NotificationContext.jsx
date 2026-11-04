import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
const LIMIT = 50;
const POLL_MS = 30000;

function newestFirst(list) {
  return [...list]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, LIMIT);
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const merge = useCallback((items) => {
    setNotifications((current) => {
      const map = new Map(current.map((n) => [n.id, n]));
      for (const item of items) map.set(item.id, { ...map.get(item.id), ...item });
      return newestFirst([...map.values()]);
    });
  }, []);

  useEffect(() => {
    if (!supabase || !userId) {
      setNotifications([]);
      setToasts([]);
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);

    async function refresh() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(LIMIT);

      if (ignore) return;
      if (data) merge(data);
      setLoading(false);
    }

    refresh();

    // Live pop-ups
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          merge([payload.new]);
          setToasts((current) => [...current, payload.new].slice(-3));
          setTimeout(() => dismissToast(payload.new.id), 7000);
        }
      )
      .subscribe();

    // Backup in case the live connection drops
    const timer = setInterval(refresh, POLL_MS);

    return () => {
      ignore = true;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [userId, merge, dismissToast]);

  const markRead = useCallback(async (id) => {
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: readAt } : n))
    );

    await supabase.from("notifications").update({ read_at: readAt }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((n) => (n.read_at ? n : { ...n, read_at: readAt }))
    );

    await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("recipient_id", userId)
      .is("read_at", null);
  }, [userId]);

  const removeNotification = useCallback(async (id) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const value = {
    notifications,
    unreadCount,
    loading,
    toasts,
    dismissToast,
    markRead,
    markAllRead,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}