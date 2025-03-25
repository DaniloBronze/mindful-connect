import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CircularProgress, Box } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactElement;
}

// Criar um contexto para expor a função de verificação do diagnóstico
export const checkDiagnostic = async () => {
  if (auth.currentUser) {
    try {
      const diagnosticDoc = await getDoc(doc(db, 'diagnostics', auth.currentUser.uid));
      return diagnosticDoc.exists();
    } catch (error) {
      console.error('Erro ao verificar diagnóstico:', error);
      return false;
    }
  }
  return false;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasDiagnostic, setHasDiagnostic] = useState(false);
  const location = useLocation();

  const verifyDiagnostic = useCallback(async () => {
    const hasCompletedDiagnostic = await checkDiagnostic();
    setHasDiagnostic(hasCompletedDiagnostic);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      verifyDiagnostic();
    } else {
      setLoading(false);
    }
  }, [verifyDiagnostic]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(45deg, rgba(124, 58, 237, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasDiagnostic && location.pathname !== '/diagnostic') {
    return <Navigate to="/diagnostic" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
