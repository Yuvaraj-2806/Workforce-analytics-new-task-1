import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  InputBase,
  Badge,
  Avatar,
  useTheme,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

interface TopNavProps {
  onThemeToggle: () => void;
  isDark: boolean;
  onMobileMenuToggle?: () => void;
  onRefresh?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onThemeToggle, isDark, onMobileMenuToggle, onRefresh }) => {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(anchorEl);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleUserClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: isDark ? 'rgba(11, 15, 26, 0.85)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        color: theme.palette.text.primary,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Toolbar
        sx={{
          minHeight: '64px !important',
          px: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Section: Mobile toggle + Page Title + Live Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
          <IconButton
            sx={{
              display: { md: 'none' },
              color: theme.palette.text.secondary,
              p: 1,
              borderRadius: 2,
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
            }}
            onClick={onMobileMenuToggle}
            aria-label="Open navigation menu"
          >
            <MenuRoundedIcon />
          </IconButton>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  fontSize: { xs: '1rem', sm: '1.15rem' },
                  letterSpacing: '-0.02em',
                  background: isDark
                    ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)'
                    : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Dashboard
              </Typography>

              {/* Pulsing Live indicator */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.2,
                  py: 0.35,
                  borderRadius: 10,
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    animation: 'pulseGlow 2s infinite ease-in-out',
                    '@keyframes pulseGlow': {
                      '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.3)', opacity: 0.65 },
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: '#10b981',
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                  }}
                >
                  LIVE
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                display: { xs: 'none', md: 'block' },
                fontSize: '0.75rem',
                mt: 0.25,
              }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>

        {/* Center Section: Quick Search Bar */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.2,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 2.5,
            px: 1.75,
            py: 0.6,
            width: { md: 240, lg: 320 },
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': {
              borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.15)',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&:focus-within': {
              borderColor: '#6366f1',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.16)',
            },
          }}
        >
          <SearchRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 19 }} />
          <InputBase
            placeholder="Search employees, teams, metrics…"
            sx={{
              fontSize: '0.85rem',
              flex: 1,
              color: theme.palette.text.primary,
              '& input::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.7,
              },
            }}
          />
          <Box
            component="kbd"
            sx={{
              display: { xs: 'none', lg: 'inline-flex' },
              alignItems: 'center',
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: theme.palette.text.secondary,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            ⌘K
          </Box>
        </Box>

        {/* Right Section: Actions & User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
          {/* Refresh Action */}
          <Tooltip title="Refresh Dashboard">
            <IconButton
              onClick={handleRefreshClick}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                color: theme.palette.text.secondary,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                transition: 'all 0.2s',
                '&:hover': {
                  color: '#6366f1',
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                },
              }}
            >
              <RefreshRoundedIcon
                fontSize="small"
                sx={{
                  transition: 'transform 0.6s ease',
                  transform: isRefreshing ? 'rotate(360deg)' : 'none',
                }}
              />
            </IconButton>
          </Tooltip>

          {/* Notifications Action */}
          <Tooltip title="5 unread notifications">
            <IconButton
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                color: theme.palette.text.secondary,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                transition: 'all 0.2s',
                '&:hover': {
                  color: '#6366f1',
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                },
              }}
            >
              <Badge
                badgeContent={5}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.625rem',
                    height: 16,
                    minWidth: 16,
                    fontWeight: 700,
                    boxShadow: `0 0 0 2px ${isDark ? '#0b0f1a' : '#ffffff'}`,
                  },
                }}
              >
                <NotificationsNoneRoundedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
            <IconButton
              onClick={onThemeToggle}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                color: theme.palette.text.secondary,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                transition: 'all 0.2s',
                '&:hover': {
                  color: '#f59e0b',
                  bgcolor: 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                },
              }}
            >
              {isDark ? (
                <LightModeRoundedIcon fontSize="small" sx={{ color: '#fbbf24' }} />
              ) : (
                <DarkModeRoundedIcon fontSize="small" sx={{ color: '#6366f1' }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Vertical Divider */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: 24,
              my: 'auto',
              mx: { xs: 0.5, sm: 1 },
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
          />

          {/* User Profile Pill */}
          <Box
            onClick={handleUserClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              pl: 0.75,
              pr: { xs: 0.75, sm: 1.5 },
              py: 0.6,
              borderRadius: 3,
              cursor: 'pointer',
              border: `1px solid ${userMenuOpen ? '#6366f1' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              bgcolor: userMenuOpen
                ? isDark
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'rgba(99, 102, 241, 0.06)'
                : isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
              },
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#10b981',
                  color: '#10b981',
                  boxShadow: `0 0 0 2px ${isDark ? '#0b0f1a' : '#ffffff'}`,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                }}
              >
                Y
              </Avatar>
            </Badge>

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                flexDirection: 'column',
                whiteSpace: 'nowrap',
                textAlign: 'left',
                flexShrink: 0,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontSize: '0.8125rem',
                  color: theme.palette.text.primary,
                  whiteSpace: 'nowrap',
                }}
              >
                Yuvaraj
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  lineHeight: 1.1,
                  display: 'block',
                  whiteSpace: 'nowrap',
                }}
              >
                HR Administrator
              </Typography>
            </Box>

            <KeyboardArrowDownRoundedIcon
              sx={{
                fontSize: 18,
                color: theme.palette.text.secondary,
                display: { xs: 'none', sm: 'block' },
                transition: 'transform 0.2s',
                transform: userMenuOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          </Box>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={userMenuOpen}
            onClose={handleUserClose}
            onClick={handleUserClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.25,
                  width: 220,
                  borderRadius: 2.5,
                  boxShadow: isDark
                    ? '0 12px 32px rgba(0,0,0,0.6)'
                    : '0 12px 32px rgba(0,0,0,0.12)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  p: 0.5,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Yuvaraj
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                yuvaraj@stackly.io
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 13, color: '#10b981' }} />
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                  Active Administrator
                </Typography>
              </Box>
            </Box>
            <MenuItem sx={{ py: 1, borderRadius: 1.5, my: 0.25, fontSize: '0.85rem' }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <PersonOutlineRoundedIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem sx={{ py: 1, borderRadius: 1.5, my: 0.25, fontSize: '0.85rem' }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Account Settings
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              sx={{
                py: 1,
                borderRadius: 1.5,
                my: 0.25,
                fontSize: '0.85rem',
                color: theme.palette.error.main,
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                <LogoutRoundedIcon fontSize="small" />
              </ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav;
