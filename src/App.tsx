import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/home";
import CategoryThreadsPage from "./components/forum/CategoryThreadsPage";
import ThreadDetailPage from "./components/forum/ThreadDetailPage";
import UserProfilePage from "./components/forum/UserProfilePage";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import WhatsNewPage from "./components/forum/WhatsNewPage";
import MembersPage from "./components/forum/MembersPage";
import ForumRulesPage from "./components/forum/ForumRulesPage";
import SearchPage from "./components/forum/SearchPage";
import AdminDashboard from "./components/forum/AdminDashboard";
import AnalyticsDashboard from "./components/forum/AnalyticsDashboard";
import { ForumProvider } from "@/context/ForumContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ToastContainer, useToast } from "@/components/forum/Toast";

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/whats-new" element={<WhatsNewPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/rules" element={<ForumRulesPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/category/:categoryId" element={<CategoryThreadsPage />} />
          <Route path="/thread/:threadId" element={<ThreadDetailPage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
        </Routes>
      </Suspense>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ForumProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ForumProvider>
    </AuthProvider>
  );
}

export default App;
