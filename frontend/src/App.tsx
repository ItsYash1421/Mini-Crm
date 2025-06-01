import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampaignBuilder from './pages/CampaignBuilder';
import CampaignHistory from './pages/CampaignHistory';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Profile from './pages/Profile';
import { Box } from '@mui/material';


const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn.apply(console, args);
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      const params = new URLSearchParams(location.search);
      const redirectTo = params.get('redirect_to');
      if (redirectTo) {
        window.location.replace(redirectTo);
      } else {
        window.location.replace('/');
      }
    }
  }, [isAuthenticated, location.pathname, location.search]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {location.pathname !== '/login' && location.pathname !== '/auth/callback' && <Header />}

        <Box sx={{ mt: location.pathname !== '/login' && location.pathname !== '/auth/callback' ? 8 : 0 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/campaigns/new"
              element={isAuthenticated ? <CampaignBuilder /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/campaigns/:id"
              element={isAuthenticated ? <CampaignBuilder /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/campaigns"
              element={isAuthenticated ? <CampaignHistory /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile"
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          </Routes>
        </Box>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
