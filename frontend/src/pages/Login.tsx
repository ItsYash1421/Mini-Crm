import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  Grid,
  Fade,
  Zoom,
  Slide,
  alpha,
  CircularProgress,
  keyframes
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import config from '../config';

const glow = keyframes`
  0% { box-shadow: 0 0 5px ${alpha('#fff', 0.2)}; }
  50% { box-shadow: 0 0 20px ${alpha('#fff', 0.6)}; }
  100% { box-shadow: 0 0 5px ${alpha('#fff', 0.2)}; }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(0.5deg); }
  50% { transform: translateY(0) rotate(-0.5deg); }
  75% { transform: translateY(5px) rotate(0.5deg); }
  100% { transform: translateY(0) rotate(0deg); }
`;

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const googleAuthUrl = `${config.API_URL}/api/auth/google`;
      console.log('Initiating Google login, redirecting to:', googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Secure Authentication',
      description: 'Enterprise-grade security with Google OAuth integration'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Fast & Efficient',
      description: 'Lightning-fast campaign delivery and real-time analytics'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Smart Analytics',
      description: 'Advanced insights and performance tracking'
    }
  ];

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: { xs: 'auto', md: 'hidden' }, // Mobile scroll fix
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url(/pattern.svg)',
          opacity: 0.2,
          zIndex: -1,
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          px: { xs: 2, sm: 4, md: 0 },  // Add horizontal padding on mobile
          py: { xs: 4, md: 0 },         // Add vertical padding on mobile
        }}
      >
        <Grid container spacing={{ xs: 4, md: 4 }} sx={{ width: '100%', height: '100%', alignItems: 'center' }}>
          {/* Left Column - Features */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', pb: { xs: 4, md: 0 } }}
          >
            <Fade in timeout={1500}>
              <Box sx={{ color: 'white', pr: { md: 4 }, textAlign: { xs: 'center', md: 'left' } }}>
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 'bold',
                    mb: { xs: 2, md: 3 },
                    fontSize: { xs: '2rem', md: '3.2rem' },
                    textShadow: '2px 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  Welcome to Mini CRM
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: { xs: 4, md: 6 },
                    opacity: 0.98,
                    lineHeight: 1.8,
                    fontSize: { xs: '1rem', md: '1.4rem' },
                  }}
                >
                  Your all-in-one solution for managing marketing campaigns and customer relationships
                </Typography>

                <Grid container spacing={3}>
                  {features.map((feature, index) => (
                    <Grid item xs={12} key={index}>
                      <Zoom
                        in
                        timeout={1000}
                        style={{ transitionDelay: `${index * 150}ms` }}
                      >
                        <Paper
                          elevation={6}
                          sx={{
                            p: 3,
                            background: alpha(theme.palette.background.paper, hoveredFeature === index ? 0.3 : 0.2),
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                            borderRadius: 3,
                            transition: 'all 0.4s ease-in-out',
                            transform: hoveredFeature === index ? 'translateY(-10px)' : 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
                              background: `radial-gradient(circle at center, ${alpha(theme.palette.common.white, hoveredFeature === index ? 0.2 : 0.1)} 0%, transparent 70%)`,
                              opacity: 0.8,
                              transition: 'opacity 0.4s ease-in-out',
                            },
                          }}
                          onMouseEnter={() => setHoveredFeature(index)}
                          onMouseLeave={() => setHoveredFeature(null)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: '50%',
                                background: alpha(theme.palette.common.white, 0.3),
                                color: 'white',
                                animation: hoveredFeature === index ? `${floatAnimation} 3s ease-in-out infinite` : 'none',
                              }}
                            >
                              {feature.icon}
                            </Box>
                            <Box>
                              <Typography variant="h6" sx={{ color: 'white', mb: 0.5, fontWeight: 'bold' }}>
                                {feature.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.9) }}>
                                {feature.description}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          </Grid>

          {/* Right Column - Login */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', pt: { xs: 0, md: 0 } }}
          >
            <Slide direction="left" in timeout={1500}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <Paper
                  elevation={24}
                  sx={{
                    p: { xs: 3, md: 4 },
                    width: '100%',
                    maxWidth: { xs: '100%', md: 450 },
                    background: alpha(theme.palette.background.paper, 0.98),
                    backdropFilter: 'blur(20px)',
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.dark, 0.4)}`,
                    animation: `${glow} 5s ease-in-out infinite`,
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
                    <Typography
                      variant="h4"
                      component="h2"
                      gutterBottom
                      sx={{
                        fontWeight: 'bold',
                        color: theme.palette.primary.dark,
                        textShadow: '1px 1px 4px rgba(0,0,0,0.2)',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                      }}
                    >
                      Get Started
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                    >
                      Sign in to access your dashboard
                    </Typography>
                  </Box>

                  <Box sx={{ mb: { xs: 2, md: 3 } }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
                      sx={{
                        py: { xs: 1.4, md: 1.8 },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        background: theme.palette.common.white,
                        color: theme.palette.text.primary,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                        '&:hover': {
                          background: alpha(theme.palette.common.white, 1),
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 25px rgba(0,0,0,0.3)',
                        },
                        transition: 'all 0.3s ease-in-out',
                      }}
                    >
                      {isLoading ? 'Signing in...' : 'Continue with Google'}
                    </Button>
                  </Box>

                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      By continuing, you agree to our{' '}
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          '&:hover': { textDecoration: 'underline', color: theme.palette.primary.dark },
                          transition: 'color 0.2s ease-in-out',
                        }}
                      >
                        Terms of Service
                      </Typography>
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Slide>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;
