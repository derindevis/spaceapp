import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { AuthFormLayout } from "../components/AuthFormLayout";
import { useAuth } from "../auth/useAuth";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to login right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFormLayout
      footer={
        <p>
          Need an account?{" "}
          <Link className="font-semibold text-space-signal hover:text-cyan-300" to="/register">
            Create one
          </Link>
        </p>
      }
      subtitle="Use the account created through the FastAPI auth service."
      title="Login"
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
          <input
            autoComplete="email"
            className="mt-2 h-11 w-full rounded-md border border-space-line bg-space-ink px-3 text-sm outline-none transition focus:border-space-signal"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block text-sm font-medium" htmlFor="password">
          Password
          <input
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-md border border-space-line bg-space-ink px-3 text-sm outline-none transition focus:border-space-signal"
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="rounded-md border border-red-500/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}

        <button
          className="h-11 w-full rounded-md bg-space-signal px-4 text-sm font-semibold text-space-ink transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthFormLayout>
  );
}
