import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { AiAssistantPage } from "./pages/AiAssistantPage";
import { AsteroidsPage } from "./pages/AsteroidsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MarsExplorerPage } from "./pages/MarsExplorerPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SpaceWeatherPage } from "./pages/SpaceWeatherPage";
import { SpaceExplorerPage } from "./pages/SpaceExplorerPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LaunchTrackerPage } from "./pages/LaunchTrackerPage";

export function App() {
  return (
    <Routes>
      <Route element={<LandingPage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<AsteroidsPage />} path="/asteroids" />
        <Route element={<SpaceWeatherPage />} path="/space-weather" />
        <Route element={<MarsExplorerPage />} path="/mars-explorer" />
        <Route element={<SpaceExplorerPage />} path="/explore" />
        <Route element={<AiAssistantPage />} path="/academy" />
        <Route element={<LibraryPage />} path="/library" />
        <Route element={<LaunchTrackerPage />} path="/launches" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
