'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }

    const email = session.user.email || '';

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    loadNotifications();
  };

  const markAllAsRead = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const email = session.user.email || '';

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('user_email', email);

    if (error) {
      alert(error.message);
      return;
    }

    loadNotifications();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading notifications...
      </main>
    );
  }

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">🔔 Notifications</h1>
            <p className="text-gray-400 mt-2">
              You have {unreadCount} unread notification
              {unreadCount === 1 ? '' : 's'}.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={markAllAsRead}
              className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded font-bold"
            >
              Mark All Read
            </button>

            <a
              href="/"
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded font-bold"
            >
              Home
            </a>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-gray-900 p-6 rounded text-gray-400">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 rounded border ${
                  notification.status === 'unread'
                    ? 'bg-green-950 border-green-700'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-lg">
                      {notification.title}
                    </h2>

                    <p className="text-gray-300 mt-2">
                      {notification.message}
                    </p>

                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded capitalize ${
                      notification.status === 'unread'
                        ? 'bg-green-500 text-black'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {notification.status}
                  </span>
                </div>

                {notification.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mt-4 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}