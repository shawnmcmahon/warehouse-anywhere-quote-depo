import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "./app/AppShell";
import { RequireAuth } from "./app/RequireAuth";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { DataProvider } from "./lib/data/DataProvider";
import Landing from "./screens/Landing";
import SignIn from "./screens/SignIn";
import Onboarding from "./screens/Onboarding";
import Dashboard from "./screens/Dashboard";
import RequestsList from "./screens/RequestsList";
import RequestDetail from "./screens/RequestDetail";
import OrgSettings from "./screens/OrgSettings";
import PublicQuote from "./screens/PublicQuote";
import NotFound from "./screens/NotFound";
import DesignIndex from "./designs/DesignIndex";
import SwissEditorial from "./designs/swiss-editorial/SwissEditorial";
import IndustrialBlueprint from "./designs/industrial-blueprint/IndustrialBlueprint";
import NeomorphicCanvas from "./designs/neomorphic-canvas/NeomorphicCanvas";

/**
 * Public routes, the signed-in application under /app, and the three design
 * explorations, which stay reachable at /1 /2 /3 now that /2 carries the
 * product UI.
 */
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/onboarding"
              element={<Navigate to="/app/onboarding" replace />}
            />
            <Route path="/r/:slug" element={<PublicQuote />} />

            <Route path="/app" element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route
                  path="orgs/:orgId"
                  element={<Navigate to="requests" replace />}
                />
                <Route path="orgs/:orgId/requests" element={<RequestsList />} />
                <Route
                  path="orgs/:orgId/requests/:requestId"
                  element={<RequestDetail />}
                />
                <Route path="orgs/:orgId/settings" element={<OrgSettings />} />
              </Route>
            </Route>

            <Route path="/designs" element={<DesignIndex />} />
            <Route path="/1" element={<SwissEditorial />} />
            <Route path="/2" element={<IndustrialBlueprint />} />
            <Route path="/3" element={<NeomorphicCanvas />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
