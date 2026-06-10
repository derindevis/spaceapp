import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";
import { AuthFormLayout } from "../components/AuthFormLayout";

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({
        email,
        full_name: fullName || undefined,
        password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create account right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthFormLayout
      footer={
        <p>
          Already have an account?{" "}
          <Link className="font-semibold text-space-signal hover:text-cyan-300" to="/login">
            Login
          </Link>
        </p>
      }
      subtitle="Create a local platform account backed by the configured database."
      title="Create account"
    >
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium" htmlFor="fullName">
          Full name
          <input
            autoComplete="name"
            className="mt-2 h-11 w-full rounded-md border border-space-line bg-space-ink px-3 text-sm outline-none transition focus:border-space-signal"
            id="fullName"
            onChange={(event) => setFullName(event.target.value)}
            type="text"
            value={fullName}
          />
        </label>

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
            autoComplete="new-password"
            className="mt-2 h-11 w-full rounded-md border border-space-line bg-space-ink px-3 text-sm outline-none transition focus:border-space-signal"
            id="password"
            minLength={8}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthFormLayout>
  );
}
