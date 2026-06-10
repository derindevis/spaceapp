import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  type LoginPayload,
  type RegisterPayload,
  type User,
} from "../api/auth";
import { AuthContext } from "./auth-context";

const TOKEN_STORAGE_KEY = "space-platform-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    window.localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const persistAuth = useCallback((nextToken: string, nextUser: User) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser(token);
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginRequest(payload);
      persistAuth(response.access_token, response.user);
    },
    [persistAuth],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await registerRequest(payload);
      persistAuth(response.access_token, response.user);
    },
    [persistAuth],
  );

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      register,
      token,
      user,
    }),
    [isLoading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
