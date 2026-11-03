import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import type { WorkforceSegment } from '../../types';

interface WorkforceDonutChartProps {
  data: WorkforceSegment[];
  total: number;
  loading?: boolean;
  selectedSegment?: string | null;
  onSegmentSelect?: (segmentName: string | null) => void;
}

interface SegmentDetail {
  role: string;
  schedule: string;
  avgTenure: string;
  retention: string;
  policy: string;
  growth: string;
}

const SEGMENT_DETAILS: Record<string, SegmentDetail> = {
  'Full-time': {
    role: 'Permanent Salaried Staff',
    schedule: 'Standard 40 hrs/wk',
    avgTenure: '3.4 yrs avg',
    retention: '97.8% retention',
    policy: 'Comprehensive Health & 401(k)',
    growth: '+4.2% YoY',
  },
  'Part-time': {
    role: 'Flexible Direct Staff',
    schedule: '20–30 hrs/wk roster',
    avgTenure: '1.8 yrs avg',
    retention: '94.2% retention',
    policy: 'Prorated Leave & Health',
    growth: '+8.1% YoY',
  },
  'Contractor': {
    role: 'External Specialized Talent',
    schedule: 'SOW / Project Deliverables',
    avgTenure: '0.9 yrs avg',
    retention: '88.5% retention',
    policy: '1099 Fixed-term Agreement',
    growth: '-2.4% YoY',
  },
  'Intern': {
    role: 'University Fellowship Program',
    schedule: 'Fall 2026 Cohort',
    avgTenure: '0.4 yrs avg',
    retention: '35% offer rate',
    policy: 'Structured Mentorship & Stipend',
    growth: '+12.0% YoY',
  },
};

const WorkforceDonutChart: React.FC<WorkforceDonutChartProps> = ({
  data,
  total,
  loading = false,
  selectedSegment: externalSelected,
  onSegmentSelect,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Internal selection state if not controlled externally
  const [internalSelectedIdx, setInternalSelectedIdx] = useState<number | null>(null);

  // Sync with external or internal
  const activeIndex = externalSelected !== undefined
    ? (externalSelected ? data.findIndex((d) => d.name === externalSelected) : null)
    : internalSelectedIdx;

  const handleSelect = (idx: number | null) => {
    const nextIdx = activeIndex === idx ? null : idx;
    setInternalSelectedIdx(nextIdx);
    if (onSegmentSelect) {
      onSegmentSelect(nextIdx !== null ? data[nextIdx].name : null);
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3.5, height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width={160} height={32} />
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Skeleton variant="circular" width={160} height={160} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 2 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const activeSegment = activeIndex !== null && activeIndex >= 0 ? data[activeIndex] : null;
  const activeDetails = activeSegment ? SEGMENT_DETAILS[activeSegment.name] : null;

  return (
    <Card
      sx={{
        borderRadius: 3.5,
        height: '100%',
        overflow: 'hidden',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark
          ? 'linear-gradient(145deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.85) 100%)'
          : '#ffffff',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.36)' : '0 4px 20px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: '18px !important' },
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* Header with Title + Reset Control */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              Workforce Composition
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              Distribution by employment status
            </Typography>
          </Box>

          {activeSegment ? (
            <Chip
              label="Reset View"
              size="small"
              icon={<RestartAltRoundedIcon sx={{ fontSize: '13px !important' }} />}
              onClick={() => handleSelect(null)}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
                bgcolor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.25)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.16)',
                },
              }}
            />
          ) : (
            <Chip
              label={`${data.length} Types`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
                color: '#6366f1',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            />
          )}
        </Box>

        {/* Donut Chart + Dedicated Center Callout HUD (No Colliding Tooltip) */}
        <Box sx={{ position: 'relative', height: 160, my: 0.5 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="84%"
                paddingAngle={3}
                dataKey="value"
                onClick={(_, idx) => handleSelect(idx)}
                stroke="none"
              >
                {data.map((entry, index) => {
                  const isSelected = activeIndex === index;
                  return (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      opacity={1} // NO dimming: all slices remain 100% visible and vivid
                      stroke={isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#1e293b' : '#ffffff')}
                      strokeWidth={isSelected ? 3 : 1.5}
                      style={{
                        cursor: 'pointer',
                        outline: 'none',
                        filter: isSelected
                          ? `drop-shadow(0 0 10px ${entry.color}dd) brightness(1.15)`
                          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                        transition: 'filter 0.25s ease, stroke-width 0.2s ease',
                      }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Callout — Interactive HUD */}
          <Box
            onClick={() => {
              if (activeSegment) handleSelect(null);
            }}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              cursor: activeSegment ? 'pointer' : 'default',
              userSelect: 'none',
              p: 1,
              borderRadius: 3,
              transition: 'background 0.2s ease',
              '&:hover': activeSegment ? {
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              } : {},
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                color: activeSegment ? activeSegment.color : theme.palette.text.primary,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                transition: 'color 0.2s ease',
              }}
            >
              {activeSegment ? activeSegment.value.toLocaleString() : total.toLocaleString()}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: activeSegment ? activeSegment.color : theme.palette.text.secondary,
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'block',
                lineHeight: 1.1,
                mt: 0.3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {activeSegment ? activeSegment.name : 'Total Staff'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.65rem',
                fontWeight: 500,
                display: 'block',
                opacity: 0.8,
                lineHeight: 1,
                mt: 0.2,
              }}
            >
              {activeSegment
                ? `${Math.round((activeSegment.value / total) * 100)}% of total · Reset ✕`
                : 'Click slice to explore'}
            </Typography>
          </Box>
        </Box>

        {/* Legend Grid — Interactive Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mt: 0.5 }}>
          {data.map((seg, idx) => {
            const pct = Math.round((seg.value / total) * 100);
            const isSelected = activeIndex === idx;
            return (
              <Box
                key={seg.name}
                onClick={() => handleSelect(idx)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.1,
                  py: 0.55,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: isSelected
                    ? `${seg.color}22`
                    : isDark
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.02)',
                  border: `1.5px solid ${
                    isSelected
                      ? seg.color
                      : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.05)'
                  }`,
                  boxShadow: isSelected ? `0 0 10px ${seg.color}35` : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isSelected ? `${seg.color}28` : `${seg.color}10`,
                    borderColor: seg.color,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: seg.color,
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 8px ${seg.color}` : 'none',
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? seg.color : theme.palette.text.primary,
                        fontSize: '0.74rem',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {seg.name}
                    </Typography>
                    {isSelected && (
                      <CheckCircleRoundedIcon sx={{ fontSize: 13, color: seg.color }} />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.68rem',
                      display: 'block',
                      lineHeight: 1.1,
                    }}
                  >
                    {seg.value.toLocaleString()} · {pct}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Related Content Strip — Appears on Click */}
        <Box
          sx={{
            mt: 0.8,
            p: 1,
            borderRadius: 2,
            bgcolor: activeSegment
              ? `${activeSegment.color}0d`
              : isDark
              ? 'rgba(255,255,255,0.02)'
              : 'rgba(0,0,0,0.02)',
            border: `1px solid ${
              activeSegment
                ? `${activeSegment.color}30`
                : isDark
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.04)'
            }`,
            transition: 'all 0.25s ease',
            minHeight: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {activeSegment && activeDetails ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: activeSegment.color }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: theme.palette.text.primary }}>
                  {activeDetails.schedule} · {activeDetails.avgTenure}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpRoundedIcon sx={{ fontSize: 14, color: '#10b981' }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>
                  {activeDetails.growth}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.71rem',
                fontStyle: 'italic',
                width: '100%',
                textAlign: 'center',
              }}
            >
              💡 Click any segment above to reveal policy details & filter activity
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkforceDonutChart;
