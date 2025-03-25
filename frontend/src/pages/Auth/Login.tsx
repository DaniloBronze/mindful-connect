import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  AuthError
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import MeditationIcon from '@mui/icons-material/SelfImprovement';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const authError = err as AuthError;
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      switch (authError.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desativada.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta.';
          break;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider)
        .catch(async (popupError) => {
          if (popupError.code === 'auth/popup-closed-by-user') {
            setError('Login cancelado. Tente novamente.');
            return null;
          }
          
          // Se o erro for relacionado ao COOP, tenta usar credential
          if (popupError.code === 'auth/internal-error') {
            const credential = GoogleAuthProvider.credentialFromError(popupError);
            if (credential) {
              return await signInWithCredential(auth, credential);
            }
          }
          throw popupError;
        });

      if (result) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const authError = err as AuthError;
      let errorMessage = 'Erro ao fazer login com Google.';
      
      switch (authError.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up bloqueado pelo navegador. Permita pop-ups e tente novamente.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Requisição cancelada. Tente novamente.';
          break;
        default:
          errorMessage = 'Erro ao fazer login com Google. Tente novamente.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(45deg, rgba(124, 58, 237, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}
        >
          <MeditationIcon
            sx={{
              fontSize: 60,
              color: 'primary.main',
              mb: 2
            }}
          />
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #7C3AED 30%, #10B981 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Mindful Connect
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 400 }}
          >
            Transforme sua relação com a tecnologia e encontre o equilíbrio digital
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(211, 47, 47, 0.05)'
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleEmailLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                height: 48,
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Entrar'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>ou continue com</Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleGoogleLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
            sx={{
              height: 48,
              backgroundColor: 'background.paper',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'rgba(124, 58, 237, 0.04)',
                borderColor: 'primary.main',
              },
            }}
          >
            {loading ? 'Conectando...' : 'Entrar com Google'}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Não tem uma conta?{' '}
              <Button
                color="primary"
                onClick={() => navigate('/register')}
                disabled={loading}
                sx={{ fontWeight: 600 }}
              >
                Registre-se
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
