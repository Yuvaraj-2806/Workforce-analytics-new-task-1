import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DepartmentData } from '../../types';

interface DepartmentDistributionChartProps {
  data: DepartmentData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as DepartmentData;
  const attendanceRate = d ? Math.round((d.present / d.employees) * 100) : 0;
  return (
    <Box
      sx={{
        bgcolor: 'rgba(13,17,23,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        p: 1.5,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        minWidth: 160,
      }}
    >
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.75 }}>
        {label}
      </Typography>
      {d && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" sx={{ color: '#e2e8f0' }}>Total</Typography>
            <Typography variant="caption" sx={{ color: d.color, fontWeight: 700 }}>{d.employees}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" sx={{ color: '#e2e8f0' }}>Present</Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>{d.present}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="caption" sx={{ color: '#e2e8f0' }}>On Leave</Typography>
            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>{d.onLeave}</Typography>
          </Box>
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Attendance: <strong style={{ color: '#10b981' }}>{attendanceRate}%</strong>
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

const DepartmentDistributionChart: React.FC<DepartmentDistributionChartProps> = ({ data, loading = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, height: 380 }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ mt: 1.5 }}>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" width="100%" height={12} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent sx={{ p: '20px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Department Distribution
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
            Employees by department
          </Typography>
        </Box>

        {/* Chart */}
        <Box sx={{ flex: 1, minHeight: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              barSize={14}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                type="category"
                dataKey="department"
                tick={{ fontSize: 11, fill: theme.palette.text.secondary as string }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="employees" radius={[0, 6, 6, 0]} onMouseEnter={(_, idx) => setActiveIndex(idx)} onMouseLeave={() => setActiveIndex(null)}>
                {data.map((entry, index) => (
                  <Cell
                    key={entry.department}
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Attendance bars summary */}
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Attendance Rate
          </Typography>
          {data.slice(0, 4).map((dept) => (
            <Box key={dept.department} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" sx={{ width: 80, color: theme.palette.text.secondary, flexShrink: 0, fontSize: '0.72rem' }}>
                {dept.department}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.round((dept.present / dept.employees) * 100)}
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  '& .MuiLinearProgress-bar': { bgcolor: dept.color, borderRadius: 3 },
                }}
              />
              <Typography variant="caption" sx={{ width: 36, textAlign: 'right', fontWeight: 700, color: dept.color, fontSize: '0.72rem' }}>
                {Math.round((dept.present / dept.employees) * 100)}%
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepartmentDistributionChart;
