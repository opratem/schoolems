import React, { useState } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Collapse,
  Stack,
  Button,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiSelect' | 'date' | 'dateRange';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

interface TableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  filterValues?: FilterValues;
  onFilterChange?: (filters: FilterValues) => void;
  onClearFilters?: () => void;
  showAdvancedFilters?: boolean;
}

export default function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange = () => {},
  onClearFilters = () => {},
  showAdvancedFilters = true,
}: TableFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (filterId: string, value: any) => {
    onFilterChange({
      ...filterValues,
      [filterId]: value,
    });
  };

  const handleClearSearch = () => {
    onSearchChange('');
  };

  const handleClearAll = () => {
    onSearchChange('');
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    return Object.values(filterValues).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      return value !== null && value !== undefined && value !== '';
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = searchValue.trim() !== '' || activeFilterCount > 0;

  const renderFilter = (filter: FilterOption) => {
    const value = filterValues[filter.id] || '';

    switch (filter.type) {
      case 'text':
        return (
          <TextField
            key={filter.id}
            label={filter.label}
            placeholder={filter.placeholder}
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
        );

      case 'select':
        return (
          <FormControl key={filter.id} size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              label={filter.label}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiSelect':
        return (
          <FormControl key={filter.id} size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              input={<OutlinedInput label={filter.label} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((val) => {
                    const option = filter.options?.find(opt => opt.value === val);
                    return (
                      <Chip
                        key={val}
                        label={option?.label || val}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            key={filter.id}
            label={filter.label}
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
        );

      case 'dateRange':
        return (
          <Stack key={filter.id} direction="row" spacing={1} alignItems="center">
            <TextField
              label={`${filter.label} From`}
              type="date"
              value={value?.from || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, from: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label={`${filter.label} To`}
              type="date"
              value={value?.to || ''}
              onChange={(e) => handleFilterChange(filter.id, { ...value, to: e.target.value })}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2}>
        {/* Search and primary controls */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <TextField
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 400 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchValue && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearSearch}
                    size="small"
                    edge="end"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            {showAdvancedFilters && filters.length > 0 && (
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                startIcon={<FilterList />}
                endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
                variant="outlined"
                size="small"
                color={activeFilterCount > 0 ? 'primary' : 'inherit'}
              >
                Filters
                {activeFilterCount > 0 && (
                  <Chip
                    label={activeFilterCount}
                    size="small"
                    sx={{ ml: 1, minWidth: 24, height: 20 }}
                  />
                )}
              </Button>
            )}

            {hasActiveFilters && (
              <Button
                onClick={handleClearAll}
                startIcon={<Clear />}
                variant="text"
                size="small"
                color="error"
              >
                Clear All
              </Button>
            )}
          </Stack>
        </Stack>

        {/* Advanced filters */}
        {showAdvancedFilters && filters.length > 0 && (
          <Collapse in={showAdvanced}>
            <Divider sx={{ mb: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Advanced Filters
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                sx={{
                  '& > *': {
                    mb: 2
                  }
                }}
              >
                {filters.map(renderFilter)}
              </Stack>
            </Box>
          </Collapse>
        )}

        {/* Active filters display */}
        {hasActiveFilters && (
          <Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Active filters:
              </Typography>
              {searchValue && (
                <Chip
                  label={`Search: "${searchValue}"`}
                  onDelete={handleClearSearch}
                  size="small"
                  variant="outlined"
                />
              )}
              {Object.entries(filterValues).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;

                const filter = filters.find(f => f.id === key);
                if (!filter) return null;

                let displayValue = value;
                if (Array.isArray(value)) {
                  displayValue = value.map(v => {
                    const option = filter.options?.find(opt => opt.value === v);
                    return option?.label || v;
                  }).join(', ');
                } else if (filter.type === 'dateRange' && value.from && value.to) {
                  displayValue = `${value.from} to ${value.to}`;
                } else if (filter.type === 'select') {
                  const option = filter.options?.find(opt => opt.value === value);
                  displayValue = option?.label || value;
                }

                return (
                  <Chip
                    key={key}
                    label={`${filter.label}: ${displayValue}`}
                    onDelete={() => handleFilterChange(key, filter.type === 'multiSelect' ? [] : '')}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
