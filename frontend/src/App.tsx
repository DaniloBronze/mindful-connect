import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard/Dashboard';
import Goals from './pages/Goals/Goals';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Diagnostic from './pages/Diagnostic/Diagnostic';
import Download from './pages/Download/Download';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7C3AED', 
      light: '#9F67FF',
      dark: '#5B21B6',
    },
    secondary: {
      main: '#10B981', 
      light: '#34D399',
      dark: '#059669',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/download" element={<Download />} />
              <Route
                path="/diagnostic"
                element={
                  <PrivateRoute>
                    <Diagnostic />
                  </PrivateRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <PrivateRoute>
                    <>
                      <Header />
                      <Goals />
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <>
                      <Header />
                      <Dashboard />
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <>
                      <Header />
                      <Dashboard />
                    </>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
