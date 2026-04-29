import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Invite from "./pages/Invite.tsx";
import Unauthorized from "./pages/Unauthorized.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminBusinesses from "./pages/admin/AdminBusinesses.tsx";
import AdminBusinessNew from "./pages/admin/AdminBusinessNew.tsx";
import AdminBusinessDetail from "./pages/admin/AdminBusinessDetail.tsx";
import AdminBusinessEdit from "./pages/admin/AdminBusinessEdit.tsx";
import AdminBuyers from "./pages/admin/AdminBuyers.tsx";
import AdminActivity from "./pages/admin/AdminActivity.tsx";
import AdminRequests from "./pages/admin/AdminRequests.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import BuyerLayout from "./layouts/BuyerLayout.tsx";
import BuyerDashboard from "./pages/buyer/BuyerDashboard.tsx";
import BuyerBusiness from "./pages/buyer/BuyerBusiness.tsx";
import BuyerProfile from "./pages/buyer/BuyerProfile.tsx";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth, RedirectIfAuthed } from "@/components/RouteGuards";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <Auth />
                </RedirectIfAuthed>
              }
            />
            {/* Legacy alias */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <RequireAuth role="admin">
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="businesses" element={<AdminBusinesses />} />
              <Route path="businesses/new" element={<AdminBusinessNew />} />
              <Route path="businesses/:id" element={<AdminBusinessDetail />} />
              <Route path="businesses/:id/edit" element={<AdminBusinessEdit />} />
              <Route path="buyers" element={<AdminBuyers />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Buyer */}
            <Route
              path="/buyer"
              element={
                <RequireAuth role="buyer">
                  <BuyerLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/buyer/dashboard" replace />} />
              <Route path="dashboard" element={<BuyerDashboard />} />
              <Route path="business/:businessId" element={<BuyerBusiness />} />
              <Route path="profile" element={<BuyerProfile />} />
            </Route>
            {/* Legacy alias */}
            <Route path="/portal" element={<Navigate to="/buyer/dashboard" replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
