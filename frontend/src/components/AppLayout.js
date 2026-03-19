import React from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import '../styles/AppLayout.css';

export default function AppLayout({ user, onLogout, children }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="app-main">
        <header className="app-header">
          <NotificationCenter />
        </header>
        {children}
      </main>
    </div>
  );
}
