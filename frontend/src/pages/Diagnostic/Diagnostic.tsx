import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Slider,
  CircularProgress,
  Alert
} from '@mui/material';
import { auth, db } from '../../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Question {
  id: string;
  text: string;
  type: 'choice' | 'scale';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  marks?: { value: number; label: string }[];
}

const questions: Question[] = [
  {
    id: 'screenTime',
    text: 'Quantas horas por dia você passa em frente às telas?',
    type: 'scale',
    min: 0,
    max: 16,
    marks: [
      { value: 0, label: '0h' },
      { value: 4, label: '4h' },
      { value: 8, label: '8h' },
      { value: 12, label: '12h' },
      { value: 16, label: '16h+' },
    ],
  },
  {
    id: 'socialMedia',
    text: 'Com que frequência você verifica suas redes sociais?',
    type: 'choice',
    options: [
      { value: 'rarely', label: 'Raramente (1-2 vezes por dia)' },
      { value: 'sometimes', label: '3-5 vezes por dia' },
      { value: 'often', label: '6-10 vezes por dia' },
      { value: 'veryOften', label: 'Mais de 10 vezes por dia' },
    ],
  },
  {
    id: 'notifications',
    text: 'Como você se sente em relação às notificações do celular?',
    type: 'choice',
    options: [
      { value: 'relaxed', label: 'Relaxado, não me incomodam' },
      { value: 'neutral', label: 'Neutro, às vezes verifico' },
      { value: 'anxious', label: 'Ansioso, preciso verificar imediatamente' },
      { value: 'overwhelmed', label: 'Sobrecarregado, são muito frequentes' },
    ],
  },
  {
    id: 'focus',
    text: 'Por quanto tempo você consegue se concentrar sem verificar o celular?',
    type: 'scale',
    min: 0,
    max: 120,
    marks: [
      { value: 0, label: '0min' },
      { value: 30, label: '30min' },
      { value: 60, label: '1h' },
      { value: 90, label: '1h30' },
      { value: 120, label: '2h+' },
    ],
  },
  {
    id: 'satisfaction',
    text: 'Quão satisfeito você está com seu uso atual da tecnologia?',
    type: 'choice',
    options: [
      { value: 'very-unsatisfied', label: 'Muito insatisfeito' },
      { value: 'unsatisfied', label: 'Insatisfeito' },
      { value: 'neutral', label: 'Neutro' },
      { value: 'satisfied', label: 'Satisfeito' },
    ],
  },
];

const Diagnostic: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentQuestion = questions[activeStep];

  const handleNext = async () => {
    if (activeStep === questions.length - 1) {
      setLoading(true);
      setError('');
      
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError('Usuário não autenticado');
          return;
        }

        // Salvar o diagnóstico
        await setDoc(doc(db, 'diagnostics', userId), {
          answers,
          timestamp: new Date(),
        });
        
        // Forçar redirecionamento usando window.location
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Erro ao salvar diagnóstico:', error);
        setError('Erro ao salvar diagnóstico. Por favor, tente novamente.');
        setLoading(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAnswer = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const isAnswered = currentQuestion.id in answers;

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'choice':
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2, color: 'text.primary' }}>
              {currentQuestion.text}
            </FormLabel>
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            >
              {currentQuestion.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'scale':
        return (
          <Box sx={{ width: '100%', mt: 4 }}>
            <Typography gutterBottom color="text.primary">
              {currentQuestion.text}
            </Typography>
            <Box sx={{ px: 2, mt: 4 }}>
              <Slider
                value={answers[currentQuestion.id] || currentQuestion.min}
                onChange={(_, value) => handleAnswer(value)}
                min={currentQuestion.min}
                max={currentQuestion.max}
                marks={currentQuestion.marks}
                valueLabelDisplay="on"
              />
            </Box>
          </Box>
        );

      default:
        return null;
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
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <AssessmentIcon
            sx={{
              fontSize: 48,
              color: 'primary.main',
              mb: 2
            }}
          />
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #7C3AED 30%, #10B981 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Diagnóstico Digital
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Vamos entender melhor seus hábitos digitais para personalizar sua experiência
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
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {questions.map((question, index) => (
              <Step key={question.id}>
                <StepLabel />
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}>
            {renderQuestion()}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Voltar
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isAnswered || loading}
              sx={{ minWidth: 100 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === questions.length - 1 ? (
                'Concluir'
              ) : (
                'Próximo'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Diagnostic;
