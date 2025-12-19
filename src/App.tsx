import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginView from './pages/LoginView';
import SignupView from './pages/SignupView';
import HomeView from './pages/HomeView';
import CreateSessionView from './pages/CreateSessionView';
import JoinSessionView from './pages/JoinSessionView';
import InviteView from './pages/InviteView';

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
          <Route path="/invite/:code" element={<InviteView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
