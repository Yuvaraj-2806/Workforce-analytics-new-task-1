import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Tooltip,
  IconButton,
  useTheme,
  Collapse,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

const SIDEBAR_WIDTH_OPEN = 240;
const SIDEBAR_WIDTH_CLOSED = 64;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardRoundedIcon />, active: true },
  { label: 'Employees', icon: <PeopleRoundedIcon /> },
  { label: 'Attendance', icon: <EventNoteRoundedIcon /> },
  { label: 'Departments', icon: <AccountTreeRoundedIcon /> },
  { label: 'Workforce', icon: <WorkspacesRoundedIcon /> },
  { label: 'Analytics', icon: <BarChartRoundedIcon /> },
  { label: 'Calendar', icon: <CalendarMonthRoundedIcon /> },
];

const secondaryNav: NavItem[] = [
  { label: 'Settings', icon: <SettingsRoundedIcon /> },
  { label: 'Help & Support', icon: <HelpOutlineRoundedIcon /> },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  variant?: 'permanent' | 'temporary';
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarContent: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#0d1117' : '#ffffff',
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        width: open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: open ? '20px 16px 16px' : '20px 12px 16px',
          minHeight: 64,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}
        >
          <WorkspacesRoundedIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Collapse in={open} orientation="horizontal" timeout={200}>
          <Box sx={{ whiteSpace: 'nowrap' }}>
            <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.2, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
              Stackly
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 600 }}>
              Analytics Platform
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {/* Toggle */}
      <Box sx={{ px: open ? 1 : '4px', display: 'flex', justifyContent: open ? 'flex-end' : 'center', mb: 1 }}>
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1.5,
            width: 28,
            height: 28,
            color: theme.palette.text.secondary,
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
          }}
        >
          {open ? <ChevronLeftRoundedIcon fontSize="small" /> : <ChevronRightRoundedIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ mx: 1, mb: 1 }} />

      {/* Primary Nav */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {open && (
          <Typography variant="overline" sx={{ px: 2.5, mb: 0.25, display: 'block', color: theme.palette.text.secondary }}>
            Main Menu
          </Typography>
        )}
        <List dense disablePadding>
          {primaryNav.map((item) => (
            <Tooltip key={item.label} title={!open ? item.label : ''} placement="right" arrow>
              <ListItemButton
                selected={item.active}
                sx={{
                  px: open ? 2 : 1.5,
                  py: 0.75,
                  mx: 1,
                  mb: 0.25,
                  borderRadius: 2,
                  justifyContent: open ? 'flex-start' : 'center',
                  minHeight: 38,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 100%)',
                    borderLeft: '3px solid #6366f1',
                    pl: open ? 1.625 : 1.125,
                    '& .MuiListItemIcon-root': { color: '#6366f1' },
                    '& .MuiListItemText-primary': { color: '#6366f1', fontWeight: 700 },
                  },
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: open ? 36 : 'unset',
                    color: item.active ? '#6366f1' : theme.palette.text.secondary,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <Collapse in={open} orientation="horizontal" timeout={200}>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: item.active ? 700 : 500, whiteSpace: 'nowrap' } } }}
                    sx={{ m: 0 }}
                  />
                </Collapse>
              </ListItemButton>
            </Tooltip>
          ))}
        </List>

        <Divider sx={{ mx: 1, my: 1 }} />

        {open && (
          <Typography variant="overline" sx={{ px: 2.5, mb: 0.25, display: 'block', color: theme.palette.text.secondary }}>
            System
          </Typography>
        )}
        <List dense disablePadding>
          {secondaryNav.map((item) => (
            <Tooltip key={item.label} title={!open ? item.label : ''} placement="right" arrow>
              <ListItemButton
                sx={{
                  px: open ? 2 : 1.5,
                  py: 0.75,
                  mx: 1,
                  mb: 0.25,
                  borderRadius: 2,
                  justifyContent: open ? 'flex-start' : 'center',
                  minHeight: 38,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: open ? 36 : 'unset',
                    color: theme.palette.text.secondary,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <Collapse in={open} orientation="horizontal" timeout={200}>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' } } }}
                    sx={{ m: 0 }}
                  />
                </Collapse>
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Box>

      {/* User Profile */}
      <Divider sx={{ mx: 1, mt: 1 }} />
      <Box
        sx={{
          p: open ? 2 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          justifyContent: open ? 'flex-start' : 'center',
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            fontSize: '0.875rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Y
        </Avatar>
        <Collapse in={open} orientation="horizontal" timeout={200}>
          <Box sx={{ whiteSpace: 'nowrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.8125rem' }}>
              Yuvaraj
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              HR Administrator
            </Typography>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle, variant = 'permanent', mobileOpen = false, onMobileClose }) => {
  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH_OPEN,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        <SidebarContent open={true} onToggle={onMobileClose || onToggle} />
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <SidebarContent open={open} onToggle={onToggle} />
    </Box>
  );
};

export default Sidebar;
