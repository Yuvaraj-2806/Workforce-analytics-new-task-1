import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  useTheme,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { departmentOptions, locationOptions, statusOptions } from '../../data/mockData';
import type { FilterState } from '../../types';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleReset = () => {
    onChange({
      dateFrom: '',
      dateTo: '',
      department: [],
      location: '',
      status: 'All',
    });
  };

  const handleQuickPreset = (preset: 'all' | 'today' | '7d' | '30d' | 'quarter') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      onChange({ ...filters, dateFrom: '', dateTo: '' });
    } else if (preset === 'today') {
      const dStr = formatDate(today);
      onChange({ ...filters, dateFrom: dStr, dateTo: dStr });
    } else if (preset === '7d') {
      const prior = new Date();
      prior.setDate(today.getDate() - 7);
      onChange({ ...filters, dateFrom: formatDate(prior), dateTo: formatDate(today) });
    } else if (preset === '30d') {
      const prior = new Date();
      prior.setDate(today.getDate() - 30);
      onChange({ ...filters, dateFrom: formatDate(prior), dateTo: formatDate(today) });
    } else if (preset === 'quarter') {
      onChange({ ...filters, dateFrom: '2026-10-01', dateTo: '2026-12-31' });
    }
  };

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.department.length > 0 ? 'dept' : '',
    filters.location && filters.location !== 'All Locations' ? filters.location : '',
    filters.status !== 'All' ? filters.status : '',
  ].filter(Boolean).length;

  // Common input styling to guarantee 100% unified appearance
  const commonControlSx = {
    height: 42,
    borderRadius: 2,
    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(99,102,241,0.4)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#6366f1',
      borderWidth: 2,
    },
  };

  return (
    <Card
      sx={{
        borderRadius: 3.5,
        mb: 3,
        overflow: 'visible',
        background: isDark
          ? 'linear-gradient(145deg, rgba(17,24,39,0.85) 0%, rgba(15,23,42,0.75) 100%)'
          : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.35)'
          : '0 4px 20px rgba(0,0,0,0.04)',
        '&:hover': { transform: 'none' },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.25 }, overflow: 'visible' }}>
        {/* ── Top Bar: Title + Quick Presets + Reset ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
          }}
        >
          {/* Left: Filter title + active count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: 'rgba(99,102,241,0.12)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilterListRoundedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: theme.palette.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              Filters & Date Range
            </Typography>

            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} active`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: '#6366f1',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(99,102,241,0.4)',
                }}
              />
            )}
          </Box>

          {/* Right: Quick Range Presets & Reset */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                mr: 0.5,
                fontWeight: 600,
                display: { xs: 'none', md: 'block' },
              }}
            >
              Quick Presets:
            </Typography>

            {[
              { id: 'all', label: 'All Time' },
              { id: '7d', label: 'Last 7D' },
              { id: '30d', label: 'Last 30D' },
              { id: 'quarter', label: 'Q4 2026' },
            ].map((p) => (
              <Chip
                key={p.id}
                label={p.label}
                size="small"
                onClick={() => handleQuickPreset(p.id as any)}
                clickable
                sx={{
                  height: 26,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  borderRadius: 1.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  color: theme.palette.text.secondary,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(99,102,241,0.1)',
                    color: '#6366f1',
                    borderColor: 'rgba(99,102,241,0.3)',
                  },
                }}
              />
            ))}

            <Button
              variant="text"
              size="small"
              startIcon={<RestartAltRoundedIcon fontSize="small" />}
              onClick={handleReset}
              disabled={activeFilterCount === 0}
              sx={{
                height: 26,
                ml: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: activeFilterCount > 0 ? theme.palette.error.main : theme.palette.text.disabled,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                },
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>

        {/* ── Main Filter Controls Row ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.75,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'visible',
            pt: '8px',
            pb: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {/* 1. Date From */}
          <FormControl size="small" sx={{ width: 170, flexShrink: 0 }}>
            <InputLabel
              id="date-from-label"
              htmlFor="date-from-input"
              shrink
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  px: 0.5,
                  borderRadius: 0.5,
                },
              }}
            >
              From Date
            </InputLabel>
            <OutlinedInput
              id="date-from-input"
              type="date"
              label="From Date"
              notched
              value={filters.dateFrom}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              startAdornment={
                <DateRangeRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: theme.palette.text.secondary,
                    mr: 0.75,
                    flexShrink: 0,
                  }}
                />
              }
              inputProps={{ 'aria-label': 'Start date' }}
              sx={{
                ...commonControlSx,
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  cursor: 'pointer',
                  opacity: 0.6,
                  '&:hover': { opacity: 1 },
                },
              }}
            />
          </FormControl>

          {/* 2. Date To */}
          <FormControl size="small" sx={{ width: 170, flexShrink: 0 }}>
            <InputLabel
              id="date-to-label"
              htmlFor="date-to-input"
              shrink
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  px: 0.5,
                  borderRadius: 0.5,
                },
              }}
            >
              To Date
            </InputLabel>
            <OutlinedInput
              id="date-to-input"
              type="date"
              label="To Date"
              notched
              value={filters.dateTo}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              startAdornment={
                <DateRangeRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: theme.palette.text.secondary,
                    mr: 0.75,
                    flexShrink: 0,
                  }}
                />
              }
              inputProps={{ 'aria-label': 'End date' }}
              sx={{
                ...commonControlSx,
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  cursor: 'pointer',
                  opacity: 0.6,
                  '&:hover': { opacity: 1 },
                },
              }}
            />
          </FormControl>

          {/* 3. Department */}
          <FormControl size="small" sx={{ width: 190, flexShrink: 0 }}>
            <InputLabel
              id="department-select-label"
              shrink
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  px: 0.5,
                  borderRadius: 0.5,
                },
              }}
            >
              Department
            </InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              multiple
              displayEmpty
              notched
              value={filters.department}
              label="Department"
              onChange={(e) =>
                onChange({ ...filters, department: e.target.value as string[] })
              }
              input={<OutlinedInput label="Department" notched placeholder="All Departments" sx={commonControlSx} />}
              startAdornment={
                <BusinessRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: theme.palette.text.secondary,
                    mr: 0.75,
                    flexShrink: 0,
                  }}
                />
              }
              renderValue={(selected) =>
                !selected || selected.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      opacity: 0.75,
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    All Departments
                  </Typography>
                ) : selected.length === 1 ? (
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {selected[0]}
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {`${selected.length} Selected`}
                  </Typography>
                )
              }
            >
              {departmentOptions.map((dept) => (
                <MenuItem key={dept} value={dept} dense sx={{ borderRadius: 1.5, my: 0.25 }}>
                  <Checkbox
                    checked={filters.department.includes(dept)}
                    size="small"
                    sx={{ p: 0.5, mr: 0.5, color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }}
                  />
                  <ListItemText
                    primary={dept}
                    slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } } }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 4. Location */}
          <FormControl size="small" sx={{ width: 175, flexShrink: 0 }}>
            <InputLabel
              id="location-select-label"
              shrink
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  px: 0.5,
                  borderRadius: 0.5,
                },
              }}
            >
              Location
            </InputLabel>
            <Select
              labelId="location-select-label"
              id="location-select"
              displayEmpty
              notched
              value={filters.location || 'All Locations'}
              label="Location"
              onChange={(e) => onChange({ ...filters, location: e.target.value })}
              input={<OutlinedInput label="Location" notched sx={commonControlSx} />}
              startAdornment={
                <PlaceRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: theme.palette.text.secondary,
                    mr: 0.75,
                    flexShrink: 0,
                  }}
                />
              }
            >
              {locationOptions.map((loc) => (
                <MenuItem key={loc} value={loc} dense sx={{ borderRadius: 1.5, my: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {loc}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 5. Status */}
          <FormControl size="small" sx={{ width: 155, flexShrink: 0 }}>
            <InputLabel
              id="status-select-label"
              shrink
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                '&.MuiInputLabel-shrink': {
                  transform: 'translate(14px, -9px) scale(0.75)',
                  bgcolor: isDark ? '#111827' : '#ffffff',
                  px: 0.5,
                  borderRadius: 0.5,
                },
              }}
            >
              Status
            </InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              notched
              value={filters.status}
              label="Status"
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              input={<OutlinedInput label="Status" notched sx={commonControlSx} />}
              startAdornment={
                <CheckCircleOutlineRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: theme.palette.text.secondary,
                    mr: 0.75,
                    flexShrink: 0,
                  }}
                />
              }
            >
              {statusOptions.map((s) => (
                <MenuItem key={s} value={s} dense sx={{ borderRadius: 1.5, my: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {s}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* ── Active Filter Pills Row (Dismissible tags) ── */}
        {activeFilterCount > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              mt: 2,
              pt: 1.5,
              borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700 }}>
              Active Filters:
            </Typography>

            {filters.dateFrom && (
              <Chip
                label={`From: ${filters.dateFrom}`}
                size="small"
                onDelete={() => onChange({ ...filters, dateFrom: '' })}
                deleteIcon={<CloseRoundedIcon style={{ fontSize: 13 }} />}
                sx={{
                  bgcolor: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              />
            )}

            {filters.dateTo && (
              <Chip
                label={`To: ${filters.dateTo}`}
                size="small"
                onDelete={() => onChange({ ...filters, dateTo: '' })}
                deleteIcon={<CloseRoundedIcon style={{ fontSize: 13 }} />}
                sx={{
                  bgcolor: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              />
            )}

            {filters.department.map((dept) => (
              <Chip
                key={dept}
                label={`Dept: ${dept}`}
                size="small"
                onDelete={() =>
                  onChange({
                    ...filters,
                    department: filters.department.filter((d) => d !== dept),
                  })
                }
                deleteIcon={<CloseRoundedIcon style={{ fontSize: 13 }} />}
                sx={{
                  bgcolor: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              />
            ))}

            {filters.location && filters.location !== 'All Locations' && (
              <Chip
                label={`Loc: ${filters.location}`}
                size="small"
                onDelete={() => onChange({ ...filters, location: '' })}
                deleteIcon={<CloseRoundedIcon style={{ fontSize: 13 }} />}
                sx={{
                  bgcolor: 'rgba(245,158,11,0.1)',
                  color: '#f59e0b',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              />
            )}

            {filters.status && filters.status !== 'All' && (
              <Chip
                label={`Status: ${filters.status}`}
                size="small"
                onDelete={() => onChange({ ...filters, status: 'All' })}
                deleteIcon={<CloseRoundedIcon style={{ fontSize: 13 }} />}
                sx={{
                  bgcolor: 'rgba(6,182,212,0.1)',
                  color: '#06b6d4',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              />
            )}

            <Button
              variant="text"
              size="small"
              onClick={handleReset}
              sx={{
                p: 0,
                minWidth: 'auto',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: theme.palette.text.secondary,
                textDecoration: 'underline',
                '&:hover': { color: theme.palette.error.main, bgcolor: 'transparent' },
              }}
            >
              Clear all
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterBar;
