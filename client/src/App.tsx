import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import AuthSuccess from './pages/AuthSuccess';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-slate-100 transition-colors duration-300">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    </Router>
    </ThemeProvider>
  );
}

export default App;
