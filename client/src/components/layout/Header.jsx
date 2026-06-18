import { useState } from 'react';
import { usePersona, PERSONAS } from '../../context/PersonaContext';
import PersonaSwitcher from './PersonaSwitcher';

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',    roles: ['admin','recruiter','applicant'],
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { key: 'jobs',         label: 'Jobs',         roles: ['admin','recruiter','applicant'],
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { key: 'applicants',   label: 'Applicants',   roles: ['admin','recruiter'],
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: 'applications', label: 'Applications', roles: ['admin','recruiter','applicant'],
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { key: 'analytics',    label: 'Analytics',    roles: ['admin','recruiter'],
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { key: 'explore',      label: 'Explore DB',   roles: ['admin'],
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
];

export default function Header({ section, setSection, onThemeToggle, isDark }) {
  const { persona } = usePersona();
  const p = PERSONAS[persona];
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(persona));

  // Auto-redirect if current section isn't accessible for persona
  const accessible = visibleNav.map(n => n.key);
  if (!accessible.includes(section)) {
    setTimeout(() => setSection('dashboard'), 0);
  }

  return (
    <header id="app-header">
      <div className="header-inner">
        {/* Logo */}
        <a className="logo" href="#" onClick={e => { e.preventDefault(); setSection('dashboard'); }}>
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>Skill<span>Stream</span></h1>
            <small>DBMS Mini Project · MongoDB</small>
          </div>
        </a>

        {/* Nav */}
        <nav id="main-nav" role="navigation" aria-label="Main sections">
          {visibleNav.map(item => (
            <button
              key={item.key}
              className={`nav-btn${section === item.key ? ' active' : ''}`}
              onClick={() => setSection(item.key)}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        {/* Header actions */}
        <div className="header-actions">
          <span className={`persona-badge ${p.color}`}>{p.emoji} {p.label}</span>
          <PersonaSwitcher />
          <button className="theme-btn" onClick={onThemeToggle} title="Toggle theme">
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}
