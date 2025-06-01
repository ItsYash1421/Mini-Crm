import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  SelectChangeEvent,
  IconButton,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ScheduleIcon from '@mui/icons-material/Schedule';
import axios from 'axios';
import config from '../config';

interface Rule {
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  rules: Rule[];
  operator: 'AND' | 'OR';
}

interface Suggestion {
  subject: string;
  body: string;
}

interface CampaignFormData {
  name: string;
  description: string;
  type: string;
  budget: string;
  segment: Segment;
  companyName: string;
  sendDate?: string;
  sendTime?: string;
}

const AVAILABLE_FIELDS = [
  { value: 'totalSpend', label: 'Total Spend (INR)' },
  { value: 'visitCount', label: 'Number of Visits' },
  { value: 'segment', label: 'Segment' },
  { value: 'tags', label: 'Tags' }
];

const OPERATORS = [
  { value: '>', label: 'Greater Than' },
  { value: '<', label: 'Less Than' },
  { value: '==', label: 'Equals' },
  { value: '>=', label: 'Greater Than or Equal' },
  { value: '<=', label: 'Less Than or Equal' },
];

const CampaignBuilder: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audienceSize, setAudienceSize] = useState<number | null>(null);
  const [campaignObjective, setCampaignObjective] = useState<string>('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [messageSuggestions, setMessageSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    type: 'email',
    budget: '',
    segment: {
      rules: [{
        field: 'totalSpend',
        operator: '>',
        value: ''
      }],
      operator: 'AND'
    },
    companyName: '',
  });
  const [segmentPrompt, setSegmentPrompt] = useState<string>('');
  const [convertingPrompt, setConvertingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [schedulingSuggestion, setSchedulingSuggestion] = useState<{ suggestedDay: string; suggestedTime: string; rationale: string } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [lookalikeLoading, setLookalikeLoading] = useState(false);
  const [lookalikeSuggestion, setLookalikeSuggestion] = useState<Segment | null>(null);
  const [lookalikeError, setLookalikeError] = useState<string | null>(null);

  const steps = ['Campaign Details', 'Audience Selection', 'Message Content', 'Schedule & Review'];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSegmentOperatorChange = (operator: 'AND' | 'OR') => {
    setFormData(prev => ({
      ...prev,
      segment: {
        ...prev.segment,
        operator
      }
    }));
  };

  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      segment: {
        ...prev.segment,
        rules: [
          ...prev.segment.rules,
          { field: 'totalSpend', operator: '>', value: '' }
        ]
      }
    }));
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      segment: {
        ...prev.segment,
        rules: prev.segment.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    let processedValue = value;
    if (field === 'value' && ['totalSpend', 'visitCount'].includes(formData.segment.rules[index].field)) {
      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
        processedValue = value;
      } else {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      segment: {
        ...prev.segment,
        rules: prev.segment.rules.map((rule, i) => 
          i === index ? { ...rule, [field]: processedValue } : rule
        )
      }
    }));
  };

  const handleObjectiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCampaignObjective(e.target.value);
  };

  const generateSuggestions = async () => {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setMessageSuggestions([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      if (!campaignObjective.trim()) {
        setSuggestionsError('Please enter a campaign objective.');
        return;
      }

      const response = await axios.post(
        `${config.API_URL}/api/campaigns/suggestions`,
        { 
          campaignObjective: campaignObjective.trim(),
          type: formData.type
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data.suggestions)) {
        setMessageSuggestions(response.data.suggestions);
        if (activeStep === 0) {
          setActiveStep(2);
        }
      } else {
         setSuggestionsError('Received unexpected response from AI service.');
      }

    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      setSuggestionsError(error.response?.data?.message || error.message || 'Failed to generate message suggestions.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description ? `${prev.description}\n\n---\n${suggestion.body}` : suggestion.body
    }));
  };

  const previewAudience = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const validatedSegment = {
        ...formData.segment,
        rules: formData.segment.rules.map(rule => {
          if (['totalSpend', 'visitCount'].includes(rule.field)) {
            const numValue = parseFloat(rule.value);
            if (isNaN(numValue)) {
              throw new Error(`Invalid number for ${rule.field}`);
            }
            return { ...rule, value: numValue.toString() };
          }
          return rule;
        })
      };

      const response = await axios.post(
        `${config.API_URL}/api/campaigns/preview-audience`,
        { segment: validatedSegment },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAudienceSize(response.data.audienceSize);
    } catch (error: any) {
      console.error('Error previewing audience:', error);
      setError(error.response?.data?.message || error.message || 'Failed to preview audience size.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${config.API_URL}/api/campaigns`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Create notification for the new campaign
      await axios.post(
        `${config.API_URL}/api/notifications`,
        {
          type: 'campaign',
          title: 'New Campaign Created',
          message: `Campaign "${formData.name}" has been created successfully.`,
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      navigate('/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentPromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSegmentPrompt(e.target.value);
    setPromptError(null);
  };

  const convertPromptToRules = async () => {
    if (!segmentPrompt.trim()) {
      setPromptError('Please enter a segment description');
      return;
    }

    setConvertingPrompt(true);
    setPromptError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${config.API_URL}/api/campaigns/convert-prompt`,
        { prompt: segmentPrompt.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data && response.data.rules) {
        setFormData(prev => ({
          ...prev,
          segment: {
            rules: response.data.rules,
            operator: response.data.operator
          }
        }));
        setSegmentPrompt('');
      }
    } catch (error: any) {
      console.error('Error converting prompt:', error);
      setPromptError(error.response?.data?.message || error.message || 'Failed to convert prompt to rules');
    } finally {
      setConvertingPrompt(false);
    }
  };

  const fetchSchedulingSuggestions = async () => {
    setSuggestionLoading(true);
    setSuggestionError(null);
    setSchedulingSuggestion(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await axios.get(`${config.API_URL}/api/campaigns/scheduling-suggestions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setSchedulingSuggestion(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching scheduling suggestions:', error);
      setSuggestionError(error.response?.data?.message || error.message || 'Failed to fetch scheduling suggestions.');
    } finally {
      setSuggestionLoading(false);
    }
  };

  const fetchLookalikeSuggestion = async () => {
    setLookalikeLoading(true);
    setLookalikeError(null);
    setLookalikeSuggestion(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await axios.post(
        `${config.API_URL}/api/campaigns/lookalike-suggestions`,
        { segment: formData.segment },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.suggestedSegment) {
        setLookalikeSuggestion(response.data.suggestedSegment);
      }
    } catch (error: any) {
      console.error('Error fetching lookalike suggestion:', error);
      setLookalikeError(error.response?.data?.message || error.message || 'Failed to fetch lookalike suggestion.');
    } finally {
      setLookalikeLoading(false);
    }
  };

  const applyLookalikeSuggestion = () => {
     if (lookalikeSuggestion) {
       setFormData(prev => ({ ...prev, segment: lookalikeSuggestion }));
       setLookalikeSuggestion(null);
     }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Box>
              <TextField
                fullWidth
                label="Campaign Name"
                name="name"
                value={formData.name}
                onChange={handleTextChange}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleTextChange}
                required
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  label="Campaign Type"
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="social">Social Media</MenuItem>
                  <MenuItem value="display">Display Ads</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Budget (INR)"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleTextChange}
                required
              />
            </Box>
            <Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3,
              alignItems: 'stretch'
            }}>
              {/* Left Column - Natural Language to Rules */}
              <Box>
                <Card sx={{ height: '100%', elevation: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Natural Language to Rules
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Describe your target audience in plain English. For example: "People who haven't shopped in 6 months and spent over ₹5K"
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Describe your target audience"
                        value={segmentPrompt}
                        onChange={handleSegmentPromptChange}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={convertPromptToRules}
                        disabled={convertingPrompt || !segmentPrompt.trim()}
                        fullWidth
                      >
                        {convertingPrompt ? 'Converting...' : 'Convert to Rules'}
                      </Button>
                    </Box>
                    {promptError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {promptError}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Right Column Container */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Current Segmentation Rules */}
                <Card sx={{ elevation: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Segmentation Rules
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addRule}
                        sx={{ mr: 2 }}
                      >
                        Add Rule
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => handleSegmentOperatorChange(formData.segment.operator === 'AND' ? 'OR' : 'AND')}
                      >
                        Switch to {formData.segment.operator === 'AND' ? 'OR' : 'AND'}
                      </Button>
                    </Box>
                    {formData.segment.rules.map((rule, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <FormControl sx={{ minWidth: 200 }}>
                          <InputLabel>Field</InputLabel>
                          <Select
                            value={rule.field}
                            onChange={(e) => updateRule(index, 'field', e.target.value)}
                            label="Field"
                          >
                            {AVAILABLE_FIELDS.map(field => (
                              <MenuItem key={field.value} value={field.value}>
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 150 }}>
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={rule.operator}
                            onChange={(e) => updateRule(index, 'operator', e.target.value)}
                            label="Operator"
                          >
                            {OPERATORS.map(op => (
                              <MenuItem key={op.value} value={op.value}>
                                {op.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Value"
                          value={rule.value}
                          onChange={(e) => updateRule(index, 'value', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <IconButton
                          color="error"
                          onClick={() => removeRule(index)}
                          disabled={formData.segment.rules.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      variant="contained"
                      startIcon={<PreviewIcon />}
                      onClick={previewAudience}
                      disabled={loading}
                      sx={{ mt: 2 }}
                    >
                      Preview Audience Size
                    </Button>
                    {audienceSize !== null && (
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        Estimated audience size: {audienceSize.toLocaleString()} customers
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Lookalike Audience Suggestions */}
                <Card sx={{ elevation: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Lookalike Audience
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Get suggestions for similar audiences based on your current segment's characteristics.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<SmartToyIcon />}
                      onClick={fetchLookalikeSuggestion}
                      disabled={lookalikeLoading}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {lookalikeLoading ? 'Analyzing...' : 'Get Lookalike Suggestions'}
                    </Button>
                    {lookalikeError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {lookalikeError}
                      </Alert>
                    )}
                    {lookalikeSuggestion && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Suggested Similar Audience:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {lookalikeSuggestion.rules.map((rule, index) => (
                            <Chip
                              key={index}
                              label={`${rule.field} ${rule.operator} ${rule.value}`}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={applyLookalikeSuggestion}
                        >
                          Apply This Audience
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Campaign Objective
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="What do you want to achieve with this campaign?"
                    value={campaignObjective}
                    onChange={handleObjectiveChange}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SmartToyIcon />}
                    onClick={generateSuggestions}
                    disabled={suggestionsLoading || !campaignObjective.trim()}
                    fullWidth
                  >
                    {suggestionsLoading ? 'Generating...' : 'Get AI Suggestions'}
                  </Button>
                  {suggestionsError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {suggestionsError}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Campaign Message"
              name="description"
              value={formData.description}
              onChange={handleTextChange}
              sx={{ mb: 3 }}
            />
            {messageSuggestions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  AI Suggestions
                </Typography>
                {messageSuggestions.map((suggestion, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {suggestion.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {suggestion.body}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Use This Suggestion
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Paper sx={{ p: 3, elevation: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Campaign Summary
              </Typography>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 4,
                mb: 4
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom>Details</Typography>
                  <Typography variant="subtitle2" color="text.secondary">Campaign Name:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.name || 'N/A'}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Company Name:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.companyName || 'N/A'}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Campaign Type:</Typography>
                  <Typography variant="body1" gutterBottom>{formData.type || 'N/A'}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Budget:</Typography>
                  <Typography variant="body1" gutterBottom>₹{formData.budget || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>Audience & Message</Typography>
                  <Typography variant="subtitle2" color="text.secondary">Audience Size:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {audienceSize !== null ? audienceSize.toLocaleString() + ' customers' : 'Not calculated'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Message Preview:</Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: 'auto',
                    wordBreak: 'break-word'
                  }}>
                    <Typography variant="body2" color="text.primary">
                      {formData.description || 'No message content'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Divider sx={{ my: 4 }} />

              <Box>
                <Typography variant="h6" gutterBottom>Scheduling Suggestions</Typography>
                <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), elevation: 1 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Get AI-powered suggestions for the optimal time to send your campaign based on customer activity patterns.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<ScheduleIcon />}
                      onClick={fetchSchedulingSuggestions}
                      disabled={suggestionLoading}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {suggestionLoading ? 'Analyzing...' : 'Get Time Suggestions'}
                    </Button>
                    {suggestionError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {suggestionError}
                      </Alert>
                    )}
                    {schedulingSuggestion && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="text.primary">
                          Recommended Schedule:
                        </Typography>
                        <Typography variant="body1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {schedulingSuggestion.suggestedDay} at {schedulingSuggestion.suggestedTime}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {schedulingSuggestion.rationale}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
              
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          Create Campaign
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default CampaignBuilder; 