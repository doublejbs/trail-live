import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginView from '@/pages/LoginView';
import SignupView from '@/pages/SignupView';
import HomeView from '@/pages/HomeView';
import CreateSessionView from '@/pages/CreateSessionView';
import JoinSessionView from '@/pages/JoinSessionView';
import SessionDetailView from '@/pages/SessionDetailView';
import InviteView from '@/pages/InviteView';
import CandidatesView from '@/pages/CandidatesView';
import AddCandidateView from '@/pages/AddCandidateView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/signup" element={<SignupView />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-session"
            element={
              <ProtectedRoute>
                <CreateSessionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-session"
            element={
              <ProtectedRoute>
                <JoinSessionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session/:sessionId"
            element={
              <ProtectedRoute>
                <SessionDetailView />
              </ProtectedRoute>
            }
          />
          <Route path="/invite/:code" element={<InviteView />} />
          <Route path="/candidates" element={<CandidatesView />} />
          <Route
            path="/add-candidate"
            element={
              <ProtectedRoute>
                <AddCandidateView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
