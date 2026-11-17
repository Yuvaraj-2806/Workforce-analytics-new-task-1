import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeIcon?: React.ReactNode;
  badgeColor?: string;
  badgeBg?: string;
  badgeBorder?: string;
  lastSynced?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badgeLabel,
  badgeIcon,
  badgeColor = '#10b981',
  badgeBg = 'rgba(16,185,129,0.1)',
  badgeBorder = 'rgba(16,185,129,0.2)',
  lastSynced,
  onRefresh,
  refreshing = false,
  actions,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: theme.palette.text.primary,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: badgeBg,
              color: badgeColor,
              border: `1px solid ${badgeBorder}`,
              borderRadius: 1.5,
              px: 1,
              py: 0.2,
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {badgeIcon}
            {badgeLabel}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.825rem' }}>
            {subtitle}
          </Typography>
          {lastSynced && (
            <>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: theme.palette.text.secondary,
                  opacity: 0.4,
                  display: { xs: 'none', sm: 'block' },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', fontWeight: 500 }}
              >
                Last synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {onRefresh && (
          <Button
            variant="outlined"
            size="small"
            onClick={onRefresh}
            disabled={refreshing}
            startIcon={
              <AutorenewRoundedIcon
                sx={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            }
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              borderRadius: 2,
              px: 1.75,
              py: 0.75,
              fontSize: '0.8125rem',
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
              },
            }}
          >
            Refresh
          </Button>
        )}
        {actions}
      </Box>
    </Box>
  );
};

export default PageHeader;
