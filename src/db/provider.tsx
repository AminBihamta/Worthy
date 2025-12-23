import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initDb } from './index';

interface DatabaseStatus {
  ready: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseStatus>({ ready: false, error: null });

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    initDb()
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err : new Error('Database error'));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ ready, error }), [ready, error]);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabaseStatus() {
  return useContext(DatabaseContext);
}
