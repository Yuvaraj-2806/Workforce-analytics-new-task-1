import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Skeleton,
} from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import { format, parseISO } from 'date-fns';
import type { EmployeeActivity } from '../../types';

interface RecentActivityTableProps {
  data: EmployeeActivity[];
  loading?: boolean;
  activeEmploymentFilter?: string | null;
  onClearEmploymentFilter?: () => void;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'check-in': { label: 'Check In', color: '#10b981', icon: <LoginRoundedIcon sx={{ fontSize: 14 }} /> },
  'check-out': { label: 'Check Out', color: '#6366f1', icon: <LogoutRoundedIcon sx={{ fontSize: 14 }} /> },
  'leave-requested': { label: 'Leave Requested', color: '#f59e0b', icon: <EventNoteRoundedIcon sx={{ fontSize: 14 }} /> },
  'leave-approved': { label: 'Leave Approved', color: '#06b6d4', icon: <CheckCircleRoundedIcon sx={{ fontSize: 14 }} /> },
  'new-hire': { label: 'New Hire', color: '#8b5cf6', icon: <PersonAddRoundedIcon sx={{ fontSize: 14 }} /> },
  resigned: { label: 'Resigned', color: '#ef4444', icon: <ExitToAppRoundedIcon sx={{ fontSize: 14 }} /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'on-leave': { label: 'On Leave', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  remote: { label: 'Remote', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  inactive: { label: 'Inactive', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  data,
  loading = false,
  activeEmploymentFilter,
  onClearEmploymentFilter,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Skeleton variant="circular" width={38} height={38} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="60%" />
              </Box>
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 4 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: '20px !important' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Recent Activity
              </Typography>
              {activeEmploymentFilter && (
                <Chip
                  label={`Filtered: ${activeEmploymentFilter}`}
                  size="small"
                  onDelete={onClearEmploymentFilter}
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    bgcolor: 'rgba(99,102,241,0.12)',
                    color: '#6366f1',
                    border: '1px solid rgba(99,102,241,0.25)',
                    '& .MuiChip-deleteIcon': {
                      fontSize: 14,
                      color: '#6366f1',
                      '&:hover': { color: '#4f46e5' },
                    },
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
              Latest employee events
            </Typography>
          </Box>
          <Chip
            label={`${data.length} events`}
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: theme.palette.text.secondary,
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          />
        </Box>

        {/* Table */}
        <TableContainer
          sx={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Table size="small" aria-label="recent employee activity table">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Department</TableCell>
                <TableCell>Action</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, idx) => {
                const action = ACTION_CONFIG[row.action];
                const status = STATUS_CONFIG[row.status];
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      },
                      '&:last-child td': { border: 0 },
                      cursor: 'default',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Employee */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            bgcolor: `${avatarColor}22`,
                            color: avatarColor,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: `1px solid ${avatarColor}40`,
                          }}
                        >
                          {row.avatar}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', color: theme.palette.text.primary }}>
                            {row.name}
                          </Typography>
                          {row.employmentType && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.66rem',
                                color: theme.palette.text.secondary,
                                display: 'block',
                                lineHeight: 1,
                              }}
                            >
                              {row.employmentType}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Department */}
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                        {row.department}
                      </Typography>
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <Chip
                        icon={action.icon as React.ReactElement}
                        label={action.label}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: `${action.color}14`,
                          color: action.color,
                          border: `1px solid ${action.color}30`,
                          '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                          whiteSpace: 'nowrap',
                        }}
                      />
                    </TableCell>

                    {/* Location */}
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8125rem', color: theme.palette.text.secondary }}>
                        {row.location}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: status.color, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: status.color, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                          {status.label}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Time */}
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                        {format(parseISO(row.timestamp), 'hh:mm a')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default RecentActivityTable;
