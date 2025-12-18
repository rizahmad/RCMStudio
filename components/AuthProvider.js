"use client";

import { createContext, useContext } from "react";

const AuthContext = createContext({
  user: null,
  role: null,
  loading: true,
  can: () => false,
});

const ROLE_ACCESS = {
  create_patient: ["ADMIN", "BILLER"],
  create_encounter: ["ADMIN", "BILLER"],
  build_claim: ["ADMIN", "BILLER"],
  submit_claim: ["ADMIN", "BILLER"],
  add_denial: ["ADMIN", "BILLER"],
  add_charge: ["ADMIN", "BILLER", "CODER"],
  run_scrubber: ["ADMIN", "BILLER", "CODER"],
  ai_review: ["ADMIN", "BILLER", "CODER"],
  apply_ai: ["ADMIN", "BILLER", "CODER"],
  settings_write: ["ADMIN"],
  manage_users: ["ADMIN"],
  audit_view: ["ADMIN"],
};

export function AuthProvider({ user, loading, children }) {
  const role = user?.role || null;
  const can = (action) => {
    if (!role) return false;
    const allowed = ROLE_ACCESS[action] || [];
    return allowed.includes(role);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
