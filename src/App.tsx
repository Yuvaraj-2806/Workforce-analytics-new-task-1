import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme, lightTheme } from './theme/theme';
import { useThemeMode } from './hooks/useThemeMode';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  const { mode, toggleTheme } = useThemeMode();
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout onThemeToggle={toggleTheme} isDark={mode === 'dark'}>
        <Dashboard />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
