import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { auth, db } from '../../config/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

interface Goal {
  id: string;
  app: string;
  targetHours: number;
  currentHours: number;
  createdAt: Date;
}

const appOptions = [
  'Instagram',
  'Facebook',
  'Twitter',
  'TikTok',
  'WhatsApp',
  'YouTube',
  'LinkedIn',
  'Outro'
];

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    app: '',
    targetHours: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Carregar metas do usuário
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError('Usuário não autenticado');
          return;
        }

        const goalsRef = collection(db, 'users', userId, 'goals');
        const goalsSnapshot = await getDocs(goalsRef);
        
        const goalsData = goalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Goal[];

        setGoals(goalsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      } catch (err) {
        console.error('Erro ao carregar metas:', err);
        setError('Erro ao carregar suas metas');
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();

    // Atualiza as metas a cada minuto para mostrar o progresso em tempo real
    const interval = setInterval(fetchGoals, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateGoal = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Usuário não autenticado');

      const goalId = Date.now().toString();
      const goalData: Omit<Goal, 'id'> = {
        app: newGoal.app,
        targetHours: parseFloat(newGoal.targetHours),
        currentHours: 0,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', userId, 'goals', goalId), goalData);

      setGoals(prev => [{
        id: goalId,
        ...goalData
      }, ...prev]);

      setNewGoal({ app: '', targetHours: '' });
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: 'Meta criada com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao criar meta. Tente novamente.',
        severity: 'error'
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Usuário não autenticado');

      await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
      
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      setSnackbar({
        open: true,
        message: 'Meta removida com sucesso!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao deletar meta:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao remover meta. Tente novamente.',
        severity: 'error'
      });
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #7C3AED 30%, #10B981 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Minhas Metas
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Nova Meta
            </Button>
          </Box>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
            }}
          >
            {goals.length > 0 ? (
              <List>
                {goals.map((goal) => (
                  <ListItem
                    key={goal.id}
                    sx={{
                      mb: 2,
                      bgcolor: 'rgba(124, 58, 237, 0.05)',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(124, 58, 237, 0.1)',
                      }
                    }}
                  >
                    <ListItemText
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                      primary={
                        <Typography variant="h6" color="primary" component="div">
                          {goal.app}
                        </Typography>
                      }
                      secondary={
                        <Box component="div">
                          <Typography variant="body2" sx={{ mb: 1 }} component="div">
                            Meta: {goal.targetHours}h | Atual: {goal.currentHours.toFixed(2)}h
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={calculateProgress(goal.currentHours, goal.targetHours)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'rgba(124, 58, 237, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'primary.main',
                                borderRadius: 4,
                              }
                            }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteGoal(goal.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  Você ainda não tem metas definidas.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Clique em "Nova Meta" para começar!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para criar nova meta */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Nova Meta</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Aplicativo"
              value={newGoal.app}
              onChange={(e) => setNewGoal(prev => ({ ...prev, app: e.target.value }))}
              sx={{ mb: 3 }}
            >
              {appOptions.map((app) => (
                <MenuItem key={app} value={app}>
                  {app}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Meta de Horas por Dia"
              type="number"
              value={newGoal.targetHours}
              onChange={(e) => setNewGoal(prev => ({ ...prev, targetHours: e.target.value }))}
              inputProps={{ min: "0", step: "0.5" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleCreateGoal}
            variant="contained"
            disabled={!newGoal.app || !newGoal.targetHours}
          >
            Criar Meta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Goals;
