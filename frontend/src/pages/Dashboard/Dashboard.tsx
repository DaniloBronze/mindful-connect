import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimerIcon from '@mui/icons-material/Timer';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import DownloadIcon from '@mui/icons-material/Download';
import { Link } from 'react-router-dom';

interface DiagnosticData {
  answers: {
    screenTime: number;
    socialMedia: string;
    notifications: string;
    focus: number;
    satisfaction: string;
  };
  timestamp: any;
}

const getRecommendations = (diagnostic: DiagnosticData) => {
  const recommendations = [];

  // Recomendações baseadas no tempo de tela
  if (diagnostic.answers.screenTime > 8) {
    recommendations.push({
      title: 'Redução do Tempo de Tela',
      icon: <TimerIcon />,
      description: 'Considere estabelecer limites de tempo para cada aplicativo e fazer pausas regulares.',
      action: 'Defina um limite diário de tempo de tela e configure lembretes de pausa.'
    });
  }

  // Recomendações baseadas no uso de redes sociais
  if (['often', 'veryOften'].includes(diagnostic.answers.socialMedia)) {
    recommendations.push({
      title: 'Uso Consciente de Redes Sociais',
      icon: <PhoneAndroidIcon />,
      description: 'Seu uso frequente de redes sociais pode estar impactando sua produtividade.',
      action: 'Estabeleça horários específicos para checar as redes sociais.'
    });
  }

  // Recomendações baseadas nas notificações
  if (['anxious', 'overwhelmed'].includes(diagnostic.answers.notifications)) {
    recommendations.push({
      title: 'Gestão de Notificações',
      icon: <NotificationsIcon />,
      description: 'As notificações parecem estar causando ansiedade ou sobrecarga.',
      action: 'Configure o modo "Não Perturbe" e silencie notificações não essenciais.'
    });
  }

  // Recomendações baseadas no foco
  if (diagnostic.answers.focus < 30) {
    recommendations.push({
      title: 'Melhoria do Foco',
      icon: <TimerIcon />,
      description: 'Períodos curtos de foco podem estar afetando sua produtividade.',
      action: 'Experimente a técnica Pomodoro: 25 minutos de foco, seguidos de 5 minutos de pausa.'
    });
  }

  return recommendations;
};

const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
  return `${minutes}min`;
};

const getSocialMediaLabel = (value: string) => {
  const labels = {
    rarely: 'Raramente (1-2 vezes por dia)',
    sometimes: '3-5 vezes por dia',
    often: '6-10 vezes por dia',
    veryOften: 'Mais de 10 vezes por dia'
  };
  return labels[value as keyof typeof labels] || value;
};

const getNotificationLabel = (value: string) => {
  const labels = {
    relaxed: 'Relaxado, não me incomodam',
    neutral: 'Neutro, às vezes verifico',
    anxious: 'Ansioso, preciso verificar imediatamente',
    overwhelmed: 'Sobrecarregado, são muito frequentes'
  };
  return labels[value as keyof typeof labels] || value;
};

const getSatisfactionLabel = (value: string) => {
  const labels = {
    'very-unsatisfied': 'Muito insatisfeito',
    'unsatisfied': 'Insatisfeito',
    'neutral': 'Neutro',
    'satisfied': 'Satisfeito'
  };
  return labels[value as keyof typeof labels] || value;
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [hasExtension, setHasExtension] = useState(false);

  useEffect(() => {
    const fetchDiagnostic = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError('Usuário não autenticado');
          return;
        }

        const diagnosticDoc = await getDoc(doc(db, 'diagnostics', userId));
        if (diagnosticDoc.exists()) {
          setDiagnostic(diagnosticDoc.data() as DiagnosticData);
        } else {
          setError('Diagnóstico não encontrado');
        }

        // Verifica se existem estatísticas do usuário (indica que a extensão está instalada)
        const statsDoc = await getDoc(doc(db, 'stats', userId));
        setHasExtension(statsDoc.exists());
      } catch (err) {
        console.error('Erro ao carregar diagnóstico:', err);
        setError('Erro ao carregar seus dados');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostic();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !diagnostic) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Erro ao carregar o diagnóstico'}</Alert>
      </Container>
    );
  }

  const recommendations = getRecommendations(diagnostic);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!hasExtension && (
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            mt: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f0f7ff',
            border: '1px solid #90caf9'
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Melhore sua Experiência!
            </Typography>
            <Typography>
              Instale nossa extensão para o Chrome e tenha acesso a estatísticas detalhadas do seu tempo nas redes sociais.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            component="a"
            href="https://mindfull-993d8.web.app/download"
            target="_blank"
            sx={{ ml: 2 }}
          >
            Baixar Extensão
          </Button>
        </Paper>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #7C3AED 30%, #10B981 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <AssessmentIcon sx={{ fontSize: 40 }} />
          Seu Bem-estar Digital
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Resultados do Diagnóstico */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              Resultados do Diagnóstico
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom component="div">
                <TimerIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Tempo de tela diário: {diagnostic.answers.screenTime}h
              </Typography>

              <Typography variant="subtitle1" gutterBottom component="div">
                <PhoneAndroidIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Frequência de uso: {getSocialMediaLabel(diagnostic.answers.socialMedia)}
              </Typography>

              <Typography variant="subtitle1" gutterBottom component="div">
                <NotificationsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Relação com notificações: {getNotificationLabel(diagnostic.answers.notifications)}
              </Typography>

              <Typography variant="subtitle1" gutterBottom component="div">
                <TimerIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Tempo de foco: {formatDuration(diagnostic.answers.focus)}
              </Typography>

              <Typography variant="subtitle1" gutterBottom component="div">
                <SentimentSatisfiedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Satisfação geral: {getSatisfactionLabel(diagnostic.answers.satisfaction)}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recomendações */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
              height: '100%'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              Recomendações Personalizadas
            </Typography>

            {recommendations.map((rec, index) => (
              <Box
                key={index}
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(124, 58, 237, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(124, 58, 237, 0.1)',
                  }
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.main',
                    fontWeight: 600
                  }}
                >
                  {rec.icon}
                  {rec.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  {rec.description}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  Sugestão: {rec.action}
                </Typography>
              </Box>
            ))}

            {recommendations.length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Parabéns! Seus hábitos digitais parecem estar bem equilibrados.
                Continue mantendo esse equilíbrio.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Seção de Metas */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              Defina Suas Metas
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Estabeleça metas personalizadas para melhorar seu bem-estar digital
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/goals"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 4
              }}
            >
              Gerenciar Metas
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
