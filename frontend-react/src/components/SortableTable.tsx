import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Box,
  Typography,
  TablePagination,
  Chip,
  Stack,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';

export type Order = 'asc' | 'desc';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  format?: (value: any, row: T) => React.ReactNode;
  render?: (row: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  selected?: readonly string[] | readonly number[];
  onSelectionChange?: (selected: readonly string[] | readonly number[]) => void;
  getRowId?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  enablePagination?: boolean;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T | string) {
  const aVal = getNestedValue(a, orderBy);
  const bVal = getNestedValue(b, orderBy);

  if (bVal < aVal) {
    return -1;
  }
  if (bVal > aVal) {
    return 1;
  }
  return 0;
}

function getNestedValue<T>(obj: T, path: keyof T | string): any {
  return String(path).split('.').reduce((o, p) => o && (o as any)[p], obj);
}

function getComparator<T>(
  order: Order,
  orderBy: keyof T | string,
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function SortableTable<T>({
  data,
  columns,
  loading = false,
  selectable = false,
  selected = [],
  onSelectionChange,
  getRowId = (row, index) => index,
  onRowClick,
  emptyMessage = 'No data available',
  enablePagination = true,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [5, 10, 25, 50],
}: SortableTableProps<T>) {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const handleRequestSort = (property: keyof T | string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;

    if (event.target.checked) {
      const newSelected = visibleRows.map((row, index) => getRowId(row, index));
      onSelectionChange(newSelected);
      return;
    }
    onSelectionChange([]);
  };

  const handleClick = (row: T, index: number) => {
    if (selectable && onSelectionChange) {
      const id = getRowId(row, index);
      const selectedIndex = selected.indexOf(id);
      let newSelected: readonly (string | number)[] = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
      } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          selected.slice(0, selectedIndex),
          selected.slice(selectedIndex + 1),
        );
      }
      onSelectionChange(newSelected);
    }

    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedData = useMemo(() => {
    if (!orderBy) return data;
    return [...data].sort(getComparator(order, orderBy));
  }, [data, order, orderBy]);

  const visibleRows = useMemo(() => {
    if (!enablePagination) return sortedData;
    return sortedData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [sortedData, page, rowsPerPage, enablePagination]);

  const isSelected = (row: T, index: number) => {
    const id = getRowId(row, index);
    return selected.indexOf(id) !== -1;
  };

  const numSelected = selected.length;
  const rowCount = visibleRows.length;

  return (
    <Box sx={{ width: '100%' }}>
      {selectable && numSelected > 0 && (
        <Box sx={{ pl: 2, pr: 1, py: 1, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1">
              {numSelected} selected
            </Typography>
            <Chip
              label={`${numSelected} item${numSelected !== 1 ? 's' : ''}`}
              size="small"
              color="secondary"
            />
          </Stack>
        </Box>
      )}

      <Table>
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={handleSelectAllClick}
                  inputProps={{
                    'aria-label': 'select all',
                  }}
                />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell
                key={String(column.id)}
                align={column.align || 'left'}
                style={{ minWidth: column.minWidth }}
                sortDirection={orderBy === column.id ? order : false}
              >
                {column.sortable !== false ? (
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                    {orderBy === column.id ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                align="center"
                sx={{ py: 8 }}
              >
                <Typography variant="body1">Loading...</Typography>
              </TableCell>
            </TableRow>
          ) : visibleRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                align="center"
                sx={{ py: 8 }}
              >
                <Typography variant="body1" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            visibleRows.map((row, index) => {
              const isItemSelected = isSelected(row, index);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={() => handleClick(row, index)}
                  role={selectable ? "checkbox" : undefined}
                  aria-checked={selectable ? isItemSelected : undefined}
                  tabIndex={-1}
                  key={getRowId(row, index)}
                  selected={isItemSelected}
                  sx={{ cursor: onRowClick || selectable ? 'pointer' : 'default' }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.align || 'left'}
                    >
                      {column.render
                        ? column.render(row)
                        : column.format
                        ? column.format(getNestedValue(row, column.id), row)
                        : getNestedValue(row, column.id)
                      }
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {enablePagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      )}
    </Box>
  );
}
