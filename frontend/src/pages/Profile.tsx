import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  createdAt?: string;
  lastLogin?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/auth/me`);
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography>Loading profile...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Profile
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: { md: '0 0 33.333%' } }}>
              <Avatar
                src={profile?.picture}
                alt={profile?.name}
                sx={{
                  width: 200,
                  height: 200,
                  mb: 2,
                  border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '& img': {
                    objectFit: 'cover',
                  },
                }}
                imgProps={{
                  crossOrigin: 'anonymous',
                  referrerPolicy: 'no-referrer',
                }}
              />
              <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                {profile?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {profile?.email}
              </Typography>
            </Box>

            <Box sx={{ flex: { md: '0 0 66.666%' } }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                  Account Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Login
                    </Typography>
                    <Typography variant="body1">
                      {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => window.open('https://myaccount.google.com/', '_blank')}
                >
                  Manage Google Account
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile;