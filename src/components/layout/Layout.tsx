import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface LayoutProps {
  children: React.ReactNode;
  onThemeToggle: () => void;
  isDark: boolean;
  onRefresh?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onThemeToggle, isDark, onRefresh }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: theme.palette.background.default }}>
      {/* Desktop sidebar */}
      {isDesktop && (
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((p) => !p)}
          variant="permanent"
        />
      )}

      {/* Mobile sidebar */}
      {!isDesktop && (
        <Sidebar
          open={false}
          onToggle={() => setMobileOpen(false)}
          variant="temporary"
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
      )}

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <TopNav
          onThemeToggle={onThemeToggle}
          isDark={isDark}
          onMobileMenuToggle={() => setMobileOpen(true)}
          onRefresh={onRefresh}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            p: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
