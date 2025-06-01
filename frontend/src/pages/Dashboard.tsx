import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import axios from 'axios';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCustomers: number;
  totalAudience: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalCustomers: 0,
    totalAudience: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${config.API_URL}/api/dashboard/stats`);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6" gutterBottom>{error}</Typography>
          <Button 
            variant="contained" 
            onClick={fetchStats} 
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        background: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 1,
            background: alpha(color, 0.2),
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: color }}>
        {value.toLocaleString()}
      </Typography>
    </Paper>
  );

  const ActionCard = ({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick: () => void }) => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              background: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onClick}
          sx={{ ml: 1, mb: 1 }}
        >
          {title}
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Box>
            <StatCard
              title="Total Campaigns"
              value={stats.totalCampaigns}
              icon={<CampaignIcon />}
              color={theme.palette.primary.main}
            />
          </Box>
          <Box>
            <StatCard
              title="Active Campaigns"
              value={stats.activeCampaigns}
              icon={<TrendingUpIcon />}
              color={theme.palette.success.main}
            />
          </Box>
          <Box>
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={<PeopleIcon />}
              color={theme.palette.info.main}
            />
          </Box>
          <Box>
            <StatCard
              title="Total Audience"
              value={stats.totalAudience}
              icon={<GroupIcon />}
              color={theme.palette.warning.main}
            />
          </Box>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
          Quick Actions
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <Box>
            <ActionCard
              title="Create Campaign"
              description="Create a new marketing campaign with custom audience segments and targeted messaging"
              icon={<CampaignIcon />}
              onClick={() => navigate('/campaigns/new')}
            />
          </Box>
          <Box>
            <ActionCard
              title="View Campaigns"
              description="View and manage your existing marketing campaigns, track performance, and make adjustments"
              icon={<PeopleIcon />}
              onClick={() => navigate('/campaigns')}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard; 