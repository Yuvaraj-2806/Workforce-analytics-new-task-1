import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useTheme, Tooltip } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { KpiData } from '../../types';

const ICON_MAP: Record<string, React.ReactNode> = {
  people: <PeopleRoundedIcon sx={{ fontSize: 18 }} />,
  check_circle: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />,
  event_busy: <EventBusyRoundedIcon sx={{ fontSize: 18 }} />,
  person_add: <PersonAddRoundedIcon sx={{ fontSize: 18 }} />,
  trending_down: <TrendingDownIcon sx={{ fontSize: 18 }} />,
};

interface MetricConfig {
  category: string;
  meterPercent: number; // 0 to 100
  meterLabel: string;
  meterTarget: string;
  footnote: string;
}

const KPI_CONFIG: Record<string, MetricConfig> = {
  'total-employees': {
    category: 'HEADCOUNT',
    meterPercent: 95,
    meterLabel: '95% capacity',
    meterTarget: 'Cap: 3,000',
    footnote: 'Across 6 departments',
  },
  'present-today': {
    category: 'ATTENDANCE',
    meterPercent: 91.4,
    meterLabel: '91.4% on site',
    meterTarget: 'Goal: >90%',
    footnote: '2,602 active today',
  },
  'on-leave': {
    category: 'TIME-OFF',
    meterPercent: 67,
    meterLabel: '67% allowance',
    meterTarget: 'Limit: 200',
    footnote: 'Approved leave today',
  },
  'new-hires': {
    category: 'TALENT',
    meterPercent: 96,
    meterLabel: '96% of quota',
    meterTarget: 'Goal: 50',
    footnote: 'On track with Q4 plan',
  },
  'attrition-rate': {
    category: 'RETENTION',
    meterPercent: 46,
    meterLabel: '46% of ceiling',
    meterTarget: 'Cap: 3.5%',
    footnote: 'Low retention risk',
  },
};

interface KpiCardProps {
  data: KpiData;
  loading?: boolean;
  index?: number;
  selected?: boolean;
  onClick?: () => void;
}

const useCountUp = (target: number, duration = 1200, start = false) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);

  return value;
};

const KpiCard: React.FC<KpiCardProps> = ({
  data,
  loading = false,
  index = 0,
  selected = false,
  onClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isNumeric = typeof data.value === 'number';
  const countedValue = useCountUp(isNumeric ? (data.value as number) : 0, 1200, visible);

  const config = KPI_CONFIG[data.id] || {
    category: 'METRIC',
    meterPercent: 80,
    meterLabel: 'Optimal',
    meterTarget: 'Target',
    footnote: data.description,
  };

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 60);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3.5, height: '100%', width: '100%' }}>
        <CardContent sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="rounded" width={75} height={22} />
            <Skeleton variant="rounded" width={32} height={32} />
          </Box>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="rounded" width="100%" height={16} sx={{ my: 1.5 }} />
          <Skeleton variant="rounded" width="100%" height={20} />
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.trendDirection === 'up' ? data.trendPositive : !data.trendPositive;

  return (
    <Tooltip title={`Click to filter dashboard by ${data.title}`} arrow enterDelay={700}>
      <Card
        ref={cardRef}
        onClick={onClick}
        sx={{
          borderRadius: 3.5,
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          cursor: onClick ? 'pointer' : 'default',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: `opacity 0.4s ease ${index * 0.05}s, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease`,
          border: `1px solid ${
            selected
              ? data.color
              : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)'
          }`,
          background: isDark
            ? `radial-gradient(circle at 100% 0%, ${data.color}15 0%, transparent 60%), linear-gradient(155deg, rgba(17, 24, 39, 0.95) 0%, rgba(13, 17, 28, 0.88) 100%)`
            : `radial-gradient(circle at 100% 0%, ${data.color}0c 0%, transparent 60%), linear-gradient(155deg, #ffffff 0%, #f8fafc 100%)`,
          boxShadow: selected
            ? `0 0 0 2px ${data.color}40, 0 16px 36px rgba(0,0,0,0.3)`
            : isDark
            ? '0 6px 24px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.03)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: `${data.color}77`,
            boxShadow: isDark
              ? `0 16px 36px rgba(0,0,0,0.55), 0 0 20px ${data.color}25`
              : `0 14px 32px rgba(0,0,0,0.08), 0 0 18px ${data.color}18`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${data.color}, ${data.color}44)`,
          },
        }}
      >
        <CardContent
          sx={{
            p: '18px 16px !important',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          {/* ── Tier 1: Category Badge & Icon ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            {/* Category with glowing LED dot */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1,
                py: 0.35,
                borderRadius: 1.5,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: data.color,
                  boxShadow: `0 0 8px ${data.color}`,
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: theme.palette.text.secondary,
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                {config.category}
              </Typography>
            </Box>

            {/* Icon Pill */}
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${data.color}20 0%, ${data.color}08 100%)`,
                border: `1px solid ${data.color}30`,
                color: data.color,
              }}
            >
              {ICON_MAP[data.icon]}
            </Box>
          </Box>

          {/* ── Tier 2: Metric Hero + Velocity Pill + Title ── */}
          <Box sx={{ mb: 1 }}>
            {/* Number + Trend */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.35 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.05,
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.035em',
                  fontSize: { xs: '1.65rem', sm: '1.85rem' },
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isNumeric ? countedValue.toLocaleString() : data.value}
              </Typography>

              {/* Velocity Chip */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.35,
                  px: 0.85,
                  py: 0.25,
                  borderRadius: 1.5,
                  bgcolor: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: isPositive ? '#10b981' : '#ef4444',
                  border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)'}`,
                }}
              >
                {data.trendDirection === 'up' ? (
                  <TrendingUpRoundedIcon style={{ fontSize: 13 }} />
                ) : (
                  <TrendingDownRoundedIcon style={{ fontSize: 13 }} />
                )}
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: 'inherit',
                  }}
                >
                  {data.trend > 0 ? '+' : ''}
                  {data.trend}%
                </Typography>
              </Box>
            </Box>

            {/* Title (Full width, no horizontal squeeze, NO truncation) */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: '0.84rem',
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
              }}
            >
              {data.title}
            </Typography>
          </Box>

          {/* ── Tier 3: 8-Segment Neon LED Level Meter ── */}
          <Box sx={{ my: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.6, width: '100%', mb: 0.65 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((segIndex) => {
                const segThreshold = (segIndex / 8) * 100;
                const isActive = config.meterPercent >= segThreshold - 6;
                return (
                  <Box
                    key={segIndex}
                    sx={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      bgcolor: isActive
                        ? data.color
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                      boxShadow: isActive ? `0 0 8px ${data.color}99` : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  />
                );
              })}
            </Box>

            {/* Readouts under meter */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: data.color,
                  lineHeight: 1,
                }}
              >
                {config.meterLabel}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  lineHeight: 1,
                }}
              >
                {config.meterTarget}
              </Typography>
            </Box>
          </Box>

          {/* ── Tier 4: Benchmark Baseline Footer ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1.25,
              pt: 1,
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
              minHeight: 24,
              boxSizing: 'border-box',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.72rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
              }}
            >
              {config.footnote}
            </Typography>

            {selected && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 1,
                  bgcolor: `${data.color}22`,
                  color: data.color,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  ml: 0.5,
                  border: `1px solid ${data.color}44`,
                }}
              >
                ACTIVE
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default KpiCard;
