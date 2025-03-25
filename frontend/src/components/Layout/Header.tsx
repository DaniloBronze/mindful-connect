import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FlagIcon from '@mui/icons-material/Flag';
import LogoutIcon from '@mui/icons-material/Logout';

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AppBar position="sticky" color="inherit">
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                background: 'linear-gradient(45deg, #7C3AED 30%, #9F67FF 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
                fontSize: '1.5rem'
              }}
            >
              Mindful Connect
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/dashboard')}
              startIcon={<DashboardIcon />}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                }
              }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              onClick={() => navigate('/goals')}
              startIcon={<FlagIcon />}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                }
              }}
            >
              Metas
            </Button>

            <Box sx={{ borderLeft: 1, borderColor: 'divider', mx: 2 }} />

            <IconButton 
              onClick={handleLogout}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.08)',
                }
              }}
            >
              <LogoutIcon />
            </IconButton>

            <Avatar 
              sx={{ 
                bgcolor: 'primary.main',
                width: 35,
                height: 35
              }}
            >
              {auth.currentUser?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
