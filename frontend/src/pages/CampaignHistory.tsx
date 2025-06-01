import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tooltip,
  LinearProgress,
  Stack,
  Modal,
  Pagination,
  Fade,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import config from '../config';
import debounce from 'lodash/debounce';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'failed';
  startDate: string;
  endDate: string;
  targetAudience: string;
  budget: number;
  spent: number;
  views: number;
  clicks: number;
  conversions: number;
  type: string;
  createdAt: string;
  deliveryStats: {
    sent: number;
    audienceSize: number;
    openRate?: number;
    clickRate?: number;
    failed: number;
  };
}

const CampaignHistory: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const campaignsPerPage = 9;
  const navigate = useNavigate();
  const theme = useTheme();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      filterCampaigns(term, statusFilter);
    }, 300),
    [statusFilter]
  );

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      filterCampaigns('', statusFilter);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    filterCampaigns(searchTerm, statusFilter);
  }, [statusFilter, campaigns]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/api/campaigns`);
      
      if (response.data && Array.isArray(response.data)) {
        const campaignsWithIds = response.data.map((campaign, index) => ({
          ...campaign,
          id: campaign.id || `campaign-${index}`
        }));
        setCampaigns(campaignsWithIds);
        setFilteredCampaigns(campaignsWithIds);
      } else {
        setCampaigns([]);
        setFilteredCampaigns([]);
      }
    } catch (error) {
      setCampaigns([]);
      setFilteredCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = (term: string, status: string) => {
    let filtered = [...campaigns];

    if (term) {
      const searchLower = term.toLowerCase();
      filtered = filtered.filter(
        campaign =>
          campaign.name.toLowerCase().includes(searchLower) ||
          campaign.description.toLowerCase().includes(searchLower) ||
          campaign.targetAudience.toLowerCase().includes(searchLower)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === status);
    }

    setFilteredCampaigns(filtered);
    setPage(1);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, campaign: Campaign) => {
    setAnchorEl(event.currentTarget);
    setSelectedCampaign(campaign);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCampaign(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (selectedCampaign) {
      try {
        await axios.delete(`${config.API_URL}/api/campaigns/${selectedCampaign.id}`);
        setCampaigns(campaigns.filter(c => c.id !== selectedCampaign.id));
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'default';
      case 'completed':
        return 'info';
      case 'paused':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return 'N/A';
      }
      return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatNumber = (num?: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString();
  };

  const handleCloseDetails = () => {
    setSelectedCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    navigate(`/campaigns/${campaign.id}/edit`);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentPageCampaigns = useMemo(() => {
    const startIndex = (page - 1) * campaignsPerPage;
    const endIndex = startIndex + campaignsPerPage;
    return filteredCampaigns.slice(startIndex, endIndex);
  }, [filteredCampaigns, page]);

  // Loading skeleton for campaign cards
  const CampaignSkeleton = () => (
    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' }, mb: 3 }}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" height={40} />
          <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={40} />
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Campaign History
        </Typography>

        {/* Filter Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            background: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField
                fullWidth
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '16.67%' } }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate('/campaigns/new')}
                sx={{ height: '56px' }}
              >
                New Campaign
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Campaigns Grid */}
        {loading ? (
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            {[...Array(6)].map((_, index) => (
              <CampaignSkeleton key={`skeleton-${index}`} />
            ))}
          </Stack>
        ) : filteredCampaigns.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No campaigns found
            </Typography>
          </Box>
        ) : (
          <>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              {getCurrentPageCampaigns.map((campaign, index) => (
                <Box
                  key={`campaign-${campaign.id || index}`}
                  sx={{
                    width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' },
                    mb: 3,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {campaign.name}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {campaign.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          key={`status-${campaign.id || index}`}
                          label={campaign.status}
                          color={getStatusColor(campaign.status) as any}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Chip
                          key={`date-${campaign.id || index}`}
                          icon={<AccessTimeIcon />}
                          label={formatDate(campaign.createdAt)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Progress
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(campaign.deliveryStats.sent / campaign.deliveryStats.audienceSize) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Box 
                          key={`views-${campaign.id || index}`}
                          sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}
                        >
                          <Typography variant="h6" color="primary">
                            {formatNumber(campaign.deliveryStats.sent)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sent
                          </Typography>
                        </Box>
                        <Box 
                          key={`conversions-${campaign.id || index}`}
                          sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}
                        >
                          <Typography variant="h6" color="success.main">
                            {formatNumber(campaign.deliveryStats.audienceSize)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Audience
                          </Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Budget: ${formatNumber(campaign.budget)}
                        </Typography>
                        {campaign.spent > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            ROI: {((campaign.conversions * 100) / campaign.spent).toFixed(2)}%
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => setSelectedCampaign(campaign)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Stack>

            {/* Pagination */}
            {filteredCampaigns.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(filteredCampaigns.length / campaignsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              minWidth: 400,
            },
          }}
        >
          <DialogTitle>Delete Campaign</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedCampaign?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Campaign Details Modal */}
        <Modal
          open={!!selectedCampaign}
          onClose={handleCloseDetails}
          aria-labelledby="campaign-details-modal"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{
            position: 'relative',
            width: '90%',
            maxWidth: 800,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            {selectedCampaign && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    {selectedCampaign.name}
                  </Typography>
                  <Chip 
                    label={selectedCampaign.status} 
                    color={selectedCampaign.status === 'active' ? 'success' : 'default'}
                    sx={{ ml: 2 }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  {/* Campaign Information Card */}
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon fontSize="small" />
                        Campaign Information
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Campaign Type</Typography>
                          <Typography variant="body1">{selectedCampaign.type}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Created Date</Typography>
                          <Typography variant="body1">{formatDate(selectedCampaign.createdAt)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Budget</Typography>
                          <Typography variant="body1">${formatNumber(selectedCampaign.budget)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Target Audience</Typography>
                          <Typography variant="body1">{selectedCampaign.targetAudience}</Typography>
                        </Box>
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedCampaign.description || 'No description provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics Card */}
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BarChartIcon fontSize="small" />
                        Performance Metrics
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Delivery Progress</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(selectedCampaign.deliveryStats.sent / selectedCampaign.deliveryStats.audienceSize) * 100}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatNumber(selectedCampaign.deliveryStats.sent)} sent
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatNumber(selectedCampaign.deliveryStats.audienceSize)} total
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Open Rate</Typography>
                            <Typography variant="h6" color="primary">
                              {selectedCampaign.deliveryStats.openRate?.toFixed(1) || '0'}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Click Rate</Typography>
                            <Typography variant="h6" color="primary">
                              {selectedCampaign.deliveryStats.clickRate?.toFixed(1) || '0'}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Failed</Typography>
                            <Typography variant="h6" color="error">
                              {formatNumber(selectedCampaign.deliveryStats.failed)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">Success Rate</Typography>
                            <Typography variant="h6" color="success.main">
                              {((selectedCampaign.deliveryStats.sent / selectedCampaign.deliveryStats.audienceSize) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleCloseDetails}
                  >
                    Close
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Modal>
      </Box>
    </Container>
  );
};

export default CampaignHistory; 