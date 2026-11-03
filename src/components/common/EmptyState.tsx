import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No employees match your current search criteria or filter combination.',
  actionLabel = 'Reset All Filters',
  onAction,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
          border: '1px dashed rgba(99,102,241,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <SearchOffRoundedIcon sx={{ fontSize: 32, color: 'rgba(99,102,241,0.7)' }} />
      </Box>

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: theme.palette.text.primary,
          mb: 0.5,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          maxWidth: 380,
          mb: 2.5,
          fontSize: '0.8125rem',
        }}
      >
        {description}
      </Typography>

      {onAction && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<RestartAltRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={onAction}
          sx={{
            borderColor: 'rgba(99,102,241,0.35)',
            color: '#6366f1',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            '&:hover': {
              borderColor: '#6366f1',
              bgcolor: 'rgba(99,102,241,0.06)',
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
