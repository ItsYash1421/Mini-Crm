import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  alpha,
  Container,
  Tooltip,
  Badge,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import config from '../config';

interface Notification {
  id: string;
  type: 'campaign' | 'customer' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const Header: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string; picture: string } | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        console.log('User info loaded:', parsedUserInfo); // Debug log
        setUser(parsedUserInfo);
      } catch (error) {
        console.error('Failed to parse user info:', error);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  }, []);

  // Add debug log for user state
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token found');
          return;
        }

        const response = await axios.get(`${config.API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Fetched notifications:', response.data);
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    // Set up polling for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = async () => {
    console.log('handleNotificationsClose called');
    setNotificationsAnchor(null);
    console.log('Unread count when closing:', unreadCount);
    // Mark all unread notifications as read when the menu is closed
    if (unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.put(`${config.API_URL}/api/notifications/read-all`, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          // Optimistically update the UI or refetch notifications
          setUnreadCount(0);
          // Optionally refetch to get updated read status, or update state directly
           // fetchNotifications(); 
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUser(null);
    setAnchorEl(null);
    setNotificationsAnchor(null);
    setMobileMenuOpen(false);
    
    // Force redirect to login page
    window.location.href = '/login';
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
  ];

  const renderNavItems = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {navItems.map((item) => (
        <Button
          key={item.text}
          component={Link}
          to={item.path}
          startIcon={item.icon}
          sx={{
            color: isActive(item.path) ? '#fff' : alpha('#fff', 0.8),
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: isActive(item.path) ? '100%' : '0%',
              height: 2,
              backgroundColor: '#fff',
              transition: 'width 0.3s ease-in-out',
            },
            '&:hover': {
              backgroundColor: alpha('#fff', 0.1),
              color: '#fff',
            },
            '&:hover::after': {
              width: '100%',
            },
          }}
        >
          {item.text}
        </Button>
      ))}
    </Box>
  );

  const renderMobileMenu = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          width: 280,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          src={user?.picture} 
          alt={user?.name}
          sx={{
            width: 56,
            height: 56,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        />
        <Box>
          <Typography variant="subtitle1">{user?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileMenuOpen(false);
            }}
            selected={isActive(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? theme.palette.primary.main : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
        <Divider />
        <ListItemButton
          onClick={() => {
            navigate('/profile');
            setMobileMenuOpen(false);
          }}
        >
          <ListItemIcon>
            <AccountCircleIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>
        <ListItemButton
          onClick={handleLogout}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Drawer>
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return <CampaignIcon fontSize="small" />;
      case 'customer':
        return <PeopleIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'campaign':
        return 'primary';
      case 'customer':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CampaignIcon sx={{ color: '#fff' }} />
            Mini CRM
          </Typography>

          {!isMobile && renderNavItems()}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotificationsOpen}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha('#fff', 0.1),
                  },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={user?.name || 'Account'}>
              <IconButton
                onClick={handleMenu}
                sx={{
                  p: 0,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
              >
                <Avatar
                  src={user?.picture}
                  alt={user?.name || 'User'}
                  sx={{
                    width: 40,
                    height: 40,
                    border: `2px solid ${alpha('#fff', 0.2)}`,
                    bgcolor: user?.picture ? 'transparent' : theme.palette.primary.dark,
                  }}
                >
                  {!user?.picture && user?.name ? user.name.charAt(0).toUpperCase() : null}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                boxShadow: theme.shadows[3],
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="subtitle1">{user?.name || 'User'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
            <MenuItem component={Link} to="/profile" onClick={handleClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 300,
                maxHeight: 400,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                boxShadow: theme.shadows[3],
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="h6">Notifications</Typography>
            </Box>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  sx={{
                    backgroundColor: notification.read ? 'inherit' : alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Box sx={{ p: 1, width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                      <Typography variant="subtitle2">{notification.title}</Typography>
                      <Chip
                        label={notification.type}
                        size="small"
                        color={getNotificationColor(notification.type) as any}
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(notification.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                  No notifications
                </Typography>
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </Container>
      {renderMobileMenu()}
    </AppBar>
  );
};

export default Header; 