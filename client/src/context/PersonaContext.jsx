import { createContext, useContext, useState } from 'react';

const PersonaContext = createContext(null);

export const PERSONAS = {
  admin:     { label: 'DB Admin',   emoji: '🛠️',  color: 'admin' },
  recruiter: { label: 'Recruiter',  emoji: '💼',  color: 'recruiter' },
  applicant: { label: 'Applicant',  emoji: '👤',  color: 'applicant' },
};

export function PersonaProvider({ children }) {
  const [persona, setPersona] = useState('recruiter');
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
