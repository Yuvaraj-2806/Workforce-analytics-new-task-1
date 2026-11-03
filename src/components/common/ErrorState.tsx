import React from 'react';
import { Box, Typography, Button, Card, CardContent, useTheme } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong while loading dashboard data.',
  onRetry,
}) => {
  const theme = useTheme();

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid rgba(239,68,68,0.2)' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(239,68,68,0.08)',
              border: '2px solid rgba(239,68,68,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
            }}
          >
            <ErrorOutlineRoundedIcon sx={{ fontSize: 36, color: '#ef4444' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary }}>
            Failed to Load Data
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, maxWidth: 360, mb: 3 }}>
            {message}
          </Typography>
          {onRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              onClick={onRetry}
              sx={{
                bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626' },
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
              }}
            >
              Retry
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ErrorState;
