import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from '../components/feedback/ToastContainer';
import { CreateExperimentModal } from '../features/experiments/components/CreateExperimentModal';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Persistent on desktop, drawer on mobile) */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals & Overlays */}
      <CreateExperimentModal />
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
