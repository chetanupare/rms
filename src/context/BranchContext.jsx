import { createContext, useContext, useState, useEffect } from 'react';

const BranchContext = createContext(null);

const BRANCHES = ['WANI', 'NAGPUR', 'PANDHARKAWDA'];

export function BranchProvider({ children }) {
  const [branch, setBranch] = useState(() => localStorage.getItem('slcg_branch') || 'WANI');

  useEffect(() => {
    localStorage.setItem('slcg_branch', branch);
  }, [branch]);

  return (
    <BranchContext.Provider value={{ branch, setBranch, branches: BRANCHES }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) return { branch: 'WANI', setBranch: () => {}, branches: BRANCHES };
  return ctx;
}
