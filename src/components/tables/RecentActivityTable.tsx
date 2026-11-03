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
  TableSortLabel,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Skeleton,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import { format, parseISO } from 'date-fns';
import EmptyState from '../common/EmptyState';
import type { EmployeeActivity } from '../../types';

interface RecentActivityTableProps {
  data: EmployeeActivity[];
  total: number;
  loading?: boolean;
  page: number;
  rowsPerPage: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onSortChange: (column: string) => void;
  activeEmploymentFilter?: string | null;
  onClearEmploymentFilter?: () => void;
  onResetAllFilters?: () => void;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'check-in': { label: 'Check In', color: '#10b981', icon: <LoginRoundedIcon sx={{ fontSize: 14 }} /> },
  'check-out': { label: 'Check Out', color: '#6366f1', icon: <LogoutRoundedIcon sx={{ fontSize: 14 }} /> },
  'leave-requested': { label: 'Leave Requested', color: '#f59e0b', icon: <EventNoteRoundedIcon sx={{ fontSize: 14 }} /> },
  'leave-approved': { label: 'Leave Approved', color: '#06b6d4', icon: <CheckCircleRoundedIcon sx={{ fontSize: 14 }} /> },
  'new-hire': { label: 'New Hire', color: '#8b5cf6', icon: <PersonAddRoundedIcon sx={{ fontSize: 14 }} /> },
  resigned: { label: 'Resigned', color: '#ef4444', icon: <ExitToAppRoundedIcon sx={{ fontSize: 14 }} /> },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10b981' },
  'on-leave': { label: 'On Leave', color: '#f59e0b' },
  remote: { label: 'Remote', color: '#06b6d4' },
  inactive: { label: 'Inactive', color: '#94a3b8' },
};

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  data,
  total,
  loading = false,
  page,
  rowsPerPage,
  sortBy,
  sortOrder,
  searchQuery,
  onSearchChange,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  activeEmploymentFilter,
  onClearEmploymentFilter,
  onResetAllFilters,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const formatTimestamp = (ts: string) => {
    try {
      return format(parseISO(ts), 'hh:mm a');
    } catch {
      return 'Just now';
    }
  };

  return (
    <Card sx={{ borderRadius: 3, border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.06)' }}>
      <CardContent sx={{ p: '20px !important' }}>
        {/* Header with Title and Search Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mb: 2.5,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          {/* Left Title and Badges */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                Employee Directory & Activity
              </Typography>
              {activeEmploymentFilter && (
                <Chip
                  label={`Type: ${activeEmploymentFilter}`}
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
              Real-time attendance logs with live search, sorting, and pagination
            </Typography>
          </Box>

          {/* Right Controls: Search Input & Count Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employee, role, location..."
              sx={{
                width: { xs: '100%', sm: 260 },
                '& .MuiOutlinedInput-root': {
                  height: 36,
                  borderRadius: 2,
                  fontSize: '0.8125rem',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => onSearchChange('')}>
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
            <Chip
              label={`${total} total`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: theme.palette.text.secondary,
                fontWeight: 600,
                fontSize: '0.72rem',
                height: 28,
                flexShrink: 0,
              }}
            />
          </Box>
        </Box>

        {/* Table Content */}
        {loading ? (
          <Box sx={{ py: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="35%" />
                  <Skeleton variant="text" width="55%" />
                </Box>
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 4 }} />
              </Box>
            ))}
          </Box>
        ) : data.length === 0 ? (
          <EmptyState
            title="No matching employees found"
            description={
              searchQuery
                ? `No employee matches "${searchQuery}". Try modifying your search keywords or resetting filters.`
                : 'No employee records found matching your selected filter combination.'
            }
            actionLabel="Reset All Filters"
            onAction={() => {
              onSearchChange('');
              if (onResetAllFilters) onResetAllFilters();
              if (onClearEmploymentFilter) onClearEmploymentFilter();
            }}
          />
        ) : (
          <>
            <TableContainer
              sx={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              <Table size="small" aria-label="workforce activity and directory table">
                <TableHead>
                  <TableRow>
                    {/* Employee Name Sorting */}
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'name'}
                        direction={sortBy === 'name' ? sortOrder : 'asc'}
                        onClick={() => onSortChange('name')}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        Employee
                      </TableSortLabel>
                    </TableCell>

                    {/* Department Sorting */}
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <TableSortLabel
                        active={sortBy === 'department'}
                        direction={sortBy === 'department' ? sortOrder : 'asc'}
                        onClick={() => onSortChange('department')}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        Department
                      </TableSortLabel>
                    </TableCell>

                    {/* Role / Action Sorting */}
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'role'}
                        direction={sortBy === 'role' ? sortOrder : 'asc'}
                        onClick={() => onSortChange('role')}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        Role & Action
                      </TableSortLabel>
                    </TableCell>

                    {/* Location Sorting */}
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={sortBy === 'location'}
                        direction={sortBy === 'location' ? sortOrder : 'asc'}
                        onClick={() => onSortChange('location')}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        Location
                      </TableSortLabel>
                    </TableCell>

                    {/* Status Sorting */}
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'status'}
                        direction={sortBy === 'status' ? sortOrder : 'asc'}
                        onClick={() => onSortChange('status')}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>

                    {/* Timestamp Sorting */}
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <TableSortLabel
                        active={sortBy === 'timestamp'}
                        direction={sortBy === 'timestamp' ? sortOrder : 'asc'}
                        onClick={() => onSortChange('timestamp')}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        Activity Time
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.map((row, idx) => {
                    const action = ACTION_CONFIG[row.action] || ACTION_CONFIG['check-in'];
                    const status = STATUS_CONFIG[row.status] || STATUS_CONFIG['active'];
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
                        {/* Employee Avatar & Name */}
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
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8125rem',
                                  whiteSpace: 'nowrap',
                                  color: theme.palette.text.primary,
                                }}
                              >
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
                                  {row.employmentType} {row.employee_code ? `• ${row.employee_code}` : ''}
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

                        {/* Role & Action Chip */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {row.role && (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.78rem',
                                  fontWeight: 500,
                                  color: theme.palette.text.primary,
                                  display: { xs: 'none', md: 'block' },
                                }}
                              >
                                {row.role}
                              </Typography>
                            )}
                            <Chip
                              icon={action.icon as React.ReactElement}
                              label={action.label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                bgcolor: `${action.color}14`,
                                color: action.color,
                                border: `1px solid ${action.color}30`,
                                '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                                whiteSpace: 'nowrap',
                              }}
                            />
                          </Box>
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
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: status.color,
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: status.color,
                                fontSize: '0.72rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {status.label}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Time */}
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: '0.72rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatTimestamp(row.timestamp)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_e, newPage) => onPageChange(newPage)}
              onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
              sx={{
                borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                mt: 1,
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.75rem',
                  color: theme.palette.text.secondary,
                },
                '& .MuiTablePagination-select': {
                  fontSize: '0.75rem',
                },
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityTable;
