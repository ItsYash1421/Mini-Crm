import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const id = params.get('id') || '';
        const name = params.get('name') || 'User';
        const email = params.get('email') || 'user@example.com';
        const picture = params.get('picture') || '';

        if (token) {
          const userInfo = { id, name, email, picture };
          console.log('Saving user info:', userInfo); // Debug log
          
          // Save user info to localStorage first
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          
          // Then call login function
          await login(token, userInfo);
          setIsProcessing(false);
          navigate('/dashboard', { replace: true });
        } else {
          console.error('Auth callback: Token not found in params.');
          setIsProcessing(false);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        setIsProcessing(false);
        navigate('/login', { replace: true });
      }
    };

    if (isProcessing) {
      handleCallback();
    }
  }, [location, login, navigate, isProcessing]);

  if (!isProcessing) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
        color: 'white'
      }}
    >
      <CircularProgress sx={{ color: 'white' }} />
      <Typography variant="h6">Completing authentication...</Typography>
    </Box>
  );
};

export default AuthCallback; 