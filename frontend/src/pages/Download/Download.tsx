import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimerIcon from '@mui/icons-material/Timer';
import InsightsIcon from '@mui/icons-material/Insights';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Download: React.FC = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #7C3AED, #10B981)',
      py: 8,
      px: 2
    }}>
      <Container maxWidth="lg">
        <Paper 
          sx={{ 
            p: { xs: 3, md: 6 }, 
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <Box textAlign="center" mb={6}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              fontWeight="bold"
              sx={{ 
                background: 'linear-gradient(45deg, #7C3AED 30%, #10B981 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Mindful Connect
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Extensão para Chrome
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Transforme sua experiência nas redes sociais com nossa extensão inteligente que ajuda você a manter um equilíbrio digital saudável.
            </Typography>
          </Box>

          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4,
              mb: 6
            }}
          >
            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                Recursos Principais
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TimerIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Monitoramento Inteligente
                    </Typography>
                    <Typography color="text.secondary">
                      Acompanhe seu tempo nas redes sociais com estatísticas detalhadas e insights personalizados.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <InsightsIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Análise de Uso
                    </Typography>
                    <Typography color="text.secondary">
                      Visualize padrões de uso e receba recomendações para melhorar seus hábitos digitais.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <NotificationsIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Lembretes Inteligentes
                    </Typography>
                    <Typography color="text.secondary">
                      Receba lembretes personalizados para fazer pausas e manter um uso saudável.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                Como Instalar
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  'Faça o download do arquivo ZIP da extensão',
                  'Abra o Chrome e vá para chrome://extensions/',
                  'Ative o "Modo do desenvolvedor" no canto superior direito',
                  'Arraste o arquivo ZIP ou clique em "Carregar sem compactação"',
                  'Comece a usar o Mindful Connect!'
                ].map((step, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                    <CheckCircleIcon color="primary" sx={{ fontSize: 28 }} />
                    <Box>
                      <Typography variant="body1">
                        {step}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          <Box 
            sx={{ 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(16, 185, 129, 0.1))',
              borderRadius: '1rem',
              p: 4
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              href="/mindful-connect-extension.zip"
              download
              sx={{
                py: 2,
                px: 6,
                borderRadius: '0.75rem',
                fontSize: '1.25rem',
                textTransform: 'none',
                background: 'linear-gradient(45deg, #7C3AED 30%, #10B981 90%)',
                boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #6D31D0 30%, #0EA271 90%)',
                  boxShadow: '0 6px 20px 0 rgba(124, 58, 237, 0.5)'
                }
              }}
            >
              Baixar Extensão
            </Button>
            <Typography variant="subtitle1" sx={{ mt: 2, color: 'text.secondary' }}>
              Versão 1.0.0 • Gratuito • Chrome 88+
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Download;
