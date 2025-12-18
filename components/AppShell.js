"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BASE_PATH } from '../lib/clientConfig';
import { AuthProvider } from './AuthProvider';

const nav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/patients', label: 'Patients' },
  { href: '/encounters/new', label: 'Encounters' },
  { href: '/claims', label: 'Claims' },
  { href: '/worklists', label: 'Worklists' },
  { href: '/reports', label: 'Reports' },
  { href: '/settings', label: 'Settings' },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const isAuthRoute = pathname?.startsWith('/login');
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    async function loadUser() {
      setLoadingUser(true);
      const res = await fetch(`${BASE_PATH}/api/me`, { cache: 'no-store' });
      if (res.status === 401 && !isAuthRoute) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
      setLoadingUser(false);
    }
    loadUser();
  }, [pathname, router, isAuthRoute]);

  async function logout() {
    await fetch(`${BASE_PATH}/api/auth/logout`, { method: 'POST' });
    router.push('/login');
  }

  if (isAuthRoute) return children;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="w-56 border-r border-slate-200 bg-white p-4 space-y-4">
        <div className="text-lg font-semibold text-indigo-600">RCM Studio</div>
        <nav className="space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === item.href ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/users"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === '/users' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
              }`}
            >
              Users
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/audit"
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === '/audit' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100'
              }`}
            >
              Audit Logs
            </Link>
          )}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4">
          <div className="text-sm text-slate-500">Practice: RCM Studio</div>
          <div className="flex items-center gap-3 text-sm">
            {loadingUser ? <span>Loading user...</span> : <span>{user?.email}</span>}
            <button
              onClick={logout}
              className="btn btn-ghost btn-sm"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <AuthProvider user={user} loading={loadingUser}>
            {children}
          </AuthProvider>
        </main>
      </div>
    </div>
  );
}
