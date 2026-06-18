import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PersonaProvider } from './context/PersonaContext';
import Header from './components/layout/Header';
import Dashboard from './components/dashboard/Dashboard';
import JobsGrid from './components/jobs/JobsGrid';
import ApplicantsGrid from './components/applicants/ApplicantsGrid';
import ApplicationsTable from './components/applications/ApplicationsTable';
import Analytics from './components/analytics/Analytics';
import ExploreDB from './components/explore/ExploreDB';
import { AddJobModal, AddApplicantModal, AddApplicationModal } from './components/modals/Modals';
import ToastContainer from './components/Toast';
import { useToast } from './hooks/useToast';

export default function App() {
  const [section, setSection] = useState('dashboard');
  const [isDark, setIsDark] = useState(true);
  const [modal, setModal] = useState(null); // 'job' | 'applicant' | 'application'
  const [refreshKey, setRefreshKey] = useState(0);
  const { toasts, showToast } = useToast();

  const handleThemeToggle = () => {
    setIsDark(d => {
      document.documentElement.setAttribute('data-theme', d ? 'light' : 'dark');
      return !d;
    });
  };

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const sectionMap = {
    dashboard:    <Dashboard key="dashboard" setSection={setSection} onOpenModal={setModal} />,
    jobs:         <JobsGrid key={`jobs-${refreshKey}`} onOpenModal={setModal} />,
    applicants:   <ApplicantsGrid key={`applicants-${refreshKey}`} onOpenModal={setModal} />,
    applications: <ApplicationsTable key={`apps-${refreshKey}`} onOpenModal={setModal} showToast={showToast} />,
    analytics:    <Analytics key="analytics" />,
    explore:      <ExploreDB key="explore" />,
  };

  return (
    <PersonaProvider>
      {/* Ambient background */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <Header section={section} setSection={setSection} onThemeToggle={handleThemeToggle} isDark={isDark} />

      <main id="main-content" role="main">
        <AnimatePresence mode="wait">
          {sectionMap[section]}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'job' && <AddJobModal key="job-modal" onClose={() => setModal(null)} onSuccess={refresh} showToast={showToast} />}
        {modal === 'applicant' && <AddApplicantModal key="app-modal" onClose={() => setModal(null)} onSuccess={refresh} showToast={showToast} />}
        {modal === 'application' && <AddApplicationModal key="appl-modal" onClose={() => setModal(null)} onSuccess={refresh} showToast={showToast} />}
      </AnimatePresence>

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </PersonaProvider>
  );
}
