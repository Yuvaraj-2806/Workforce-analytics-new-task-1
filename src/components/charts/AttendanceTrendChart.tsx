import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { AttendanceRecord } from '../../types';

interface AttendanceTrendChartProps {
  data: AttendanceRecord[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: 'rgba(13,17,23,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        p: 1.5,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.75 }}>
        {label}
      </Typography>
      {payload.map((entry: any) => (
        <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
          <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: '0.75rem' }}>
            {entry.name}:{' '}
            <strong style={{ color: entry.color }}>{entry.value?.toLocaleString()}</strong>
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ data, loading = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const chartData = data.map((d) => ({
    ...d,
    date: format(parseISO(d.date), 'MMM d'),
  }));

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, height: 340 }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="rectangular" width="100%" height={260} sx={{ borderRadius: 2, mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: '20px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Attendance Trends
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
              30-day overview
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[
              { color: '#6366f1', label: 'Present' },
              { color: '#f59e0b', label: 'Leave' },
              { color: '#10b981', label: 'Remote' },
            ].map(({ color, label }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ flex: 1, minHeight: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLeave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRemote" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="present" name="Present" stroke="#6366f1" strokeWidth={2} fill="url(#gradPresent)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
              <Area type="monotone" dataKey="onLeave" name="Leave" stroke="#f59e0b" strokeWidth={2} fill="url(#gradLeave)" dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
              <Area type="monotone" dataKey="remote" name="Remote" stroke="#10b981" strokeWidth={2} fill="url(#gradRemote)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttendanceTrendChart;
