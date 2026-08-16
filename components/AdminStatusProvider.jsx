"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AdminStatusContext = createContext(false);

export function AdminStatusProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((json) => setIsAdmin(!!json.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <AdminStatusContext.Provider value={isAdmin}>
      {children}
    </AdminStatusContext.Provider>
  );
}

export function useIsAdmin() {
  return useContext(AdminStatusContext);
}