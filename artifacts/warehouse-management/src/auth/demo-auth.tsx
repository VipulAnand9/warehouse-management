import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  demoAuthLogin,
  getDemoSession,
  logoutDemoSession,
  type DemoLoginInput,
  type DemoUser,
} from "@workspace/api-client-react";

interface DemoAuthContextValue {
  user: DemoUser | null;
  isLoading: boolean;
  loadError: string | null;
  signIn: (input: DemoLoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  retrySession: () => Promise<void>;
}

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const retrySession = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const session = await getDemoSession();
      setUser(session.user);
    } catch {
      setUser(null);
      setLoadError("The sign-in service is unavailable. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void retrySession();
  }, [retrySession]);

  const signIn = useCallback(async (input: DemoLoginInput) => {
    const session = await demoAuthLogin(input);
    setUser(session.user);
    setLoadError(null);
  }, []);

  const signOut = useCallback(async () => {
    await logoutDemoSession();
    setUser(null);
    setLoadError(null);
  }, []);

  return (
    <DemoAuthContext.Provider
      value={{ user, isLoading, loadError, signIn, signOut, retrySession }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth(): DemoAuthContextValue {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error("useDemoAuth must be used inside DemoAuthProvider.");
  }
  return context;
}
