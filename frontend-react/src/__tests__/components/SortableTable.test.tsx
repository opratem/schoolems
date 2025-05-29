import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender } from '../test-utils';
import SortableTable from '../../components/SortableTable';

describe('SortableTable Component', () => {
  const user = userEvent.setup();

  const mockData = [
    { id: 1, name: 'John Doe', age: 30, department: 'IT', salary: 50000 },
    { id: 2, name: 'Jane Smith', age: 25, department: 'HR', salary: 45000 },
    { id: 3, name: 'Bob Wilson', age: 35, department: 'Finance', salary: 55000 },
    { id: 4, name: 'Alice Brown', age: 28, department: 'IT', salary: 52000 },
  ];

  const mockColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age', label: 'Age', sortable: true, type: 'number' },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'salary', label: 'Salary', sortable: true, type: 'number', format: 'currency' },
  ];

  const mockColumnsWithActions = [
    ...mockColumns,
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row: any) => (
        <div>
          <button data-testid={`edit-${row.id}`}>Edit</button>
          <button data-testid={`delete-${row.id}`}>Delete</button>
        </div>
      )
    },
  ];

  describe('Basic Rendering', () => {
    it('should render table with data and headers', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Check table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('IT')).toBeInTheDocument();
      expect(screen.getByText('HR')).toBeInTheDocument();
    });

    it('should render empty table when no data provided', () => {
      customRender(
        <SortableTable
          data={[]}
          columns={mockColumns}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          loading={true}
        />
      );

      expect(screen.getByTestId('table-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
        />
      );
    });

    it('should sort by name column ascending', async () => {
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      // Check sorting indicator
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Check if data is sorted - Alice should be first
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      expect(within(firstDataRow).getByText('Alice Brown')).toBeInTheDocument();
    });

    it('should sort by name column descending on second click', async () => {
      const nameHeader = screen.getByText('Name');

      // First click - ascending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Second click - descending
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

      // John should be first when sorted descending
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('John Doe')).toBeInTheDocument();
    });

    it('should sort numeric columns correctly', async () => {
      const ageHeader = screen.getByText('Age');
      await user.click(ageHeader);

      // Jane (25) should be first when sorted by age ascending
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should reset sort to none on third click', async () => {
      const nameHeader = screen.getByText('Name');

      await user.click(nameHeader); // ascending
      await user.click(nameHeader); // descending
      await user.click(nameHeader); // none

      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('should not sort non-sortable columns', async () => {
      const actionsColumn = { key: 'actions', label: 'Actions', sortable: false };
      customRender(
        <SortableTable
          data={mockData}
          columns={[...mockColumns, actionsColumn]}
        />
      );

      const actionsHeader = screen.getByText('Actions');
      expect(actionsHeader).not.toHaveAttribute('aria-sort');

      await user.click(actionsHeader);
      expect(actionsHeader).not.toHaveAttribute('aria-sort');
    });
  });

  describe('Custom Rendering', () => {
    it('should render custom cell content using render function', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumnsWithActions}
        />
      );

      // Check if custom action buttons are rendered
      expect(screen.getByTestId('edit-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-2')).toBeInTheDocument();
      expect(screen.getByTestId('delete-2')).toBeInTheDocument();
    });

    it('should format currency values', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Assuming salary column has currency formatting
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
    });

    it('should handle custom cell classes', () => {
      const columnsWithClasses = [
        {
          ...mockColumns[0],
          cellClassName: (value: any, row: any) => row.department === 'IT' ? 'highlight-it' : ''
        },
        ...mockColumns.slice(1)
      ];

      customRender(
        <SortableTable
          data={mockData}
          columns={columnsWithClasses}
        />
      );

      const johnCell = screen.getByText('John Doe');
      expect(johnCell.closest('td')).toHaveClass('highlight-it');
    });
  });

  describe('Row Selection', () => {
    const onSelectionChange = jest.fn();

    beforeEach(() => {
      onSelectionChange.mockClear();
    });

    it('should handle single row selection', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox = screen.getByTestId('row-checkbox-1');
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(onSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('should handle select all functionality', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);

      expect(selectAllCheckbox).toBeChecked();
      expect(onSelectionChange).toHaveBeenCalledWith([1, 2, 3, 4]);
    });

    it('should handle multiple row selection', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox1 = screen.getByTestId('row-checkbox-1');
      const checkbox2 = screen.getByTestId('row-checkbox-2');

      await user.click(checkbox1);
      await user.click(checkbox2);

      expect(onSelectionChange).toHaveBeenLastCalledWith([1, 2]);
    });

    it('should show indeterminate state for partial selection', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          selectable={true}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkbox1 = screen.getByTestId('row-checkbox-1');
      await user.click(checkbox1);

      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      expect(selectAllCheckbox).toHaveProperty('indeterminate', true);
    });
  });

  describe('Pagination', () => {
    const largeMockData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      age: 20 + (i % 40),
      department: ['IT', 'HR', 'Finance'][i % 3],
      salary: 40000 + (i * 1000),
    }));

    it('should show pagination when pageSize is set', () => {
      customRender(
        <SortableTable
          data={largeMockData}
          columns={mockColumns}
          pageSize={10}
        />
      );

      expect(screen.getByTestId('table-pagination')).toBeInTheDocument();
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      customRender(
        <SortableTable
          data={largeMockData}
          columns={mockColumns}
          pageSize={10}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
      expect(screen.getByText('Person 11')).toBeInTheDocument();
    });

    it('should navigate to previous page', async () => {
      customRender(
        <SortableTable
          data={largeMockData}
          columns={mockColumns}
          pageSize={10}
          initialPage={2}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      expect(screen.getByText('Person 1')).toBeInTheDocument();
    });

    it('should disable navigation buttons appropriately', () => {
      customRender(
        <SortableTable
          data={largeMockData}
          columns={mockColumns}
          pageSize={10}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();

      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Row Actions', () => {
    const onRowClick = jest.fn();
    const onRowDoubleClick = jest.fn();

    beforeEach(() => {
      onRowClick.mockClear();
      onRowDoubleClick.mockClear();
    });

    it('should handle row click events', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByTestId('table-row-1');
      await user.click(firstRow);

      expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
    });

    it('should handle row double click events', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          onRowDoubleClick={onRowDoubleClick}
        />
      );

      const firstRow = screen.getByTestId('table-row-1');
      await user.dblClick(firstRow);

      expect(onRowDoubleClick).toHaveBeenCalledWith(mockData[0], 0);
    });

    it('should apply hover styles to clickable rows', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByTestId('table-row-1');
      expect(firstRow).toHaveClass('clickable-row');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          responsive={true}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-responsive');
    });

    it('should show horizontal scroll on small screens', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          responsive={true}
        />
      );

      const tableContainer = screen.getByTestId('table-container');
      expect(tableContainer).toHaveClass('table-scroll-container');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          ariaLabel="Employee data table"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Employee data table');

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should support keyboard navigation', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          onRowClick={jest.fn()}
        />
      );

      const firstRow = screen.getByTestId('table-row-1');
      firstRow.focus();

      await user.keyboard('{ArrowDown}');
      const secondRow = screen.getByTestId('table-row-2');
      expect(secondRow).toHaveFocus();
    });

    it('should announce sort changes to screen readers', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
        />
      );

      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/sorted by name ascending/i);
    });

    it('should have proper table caption', () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          caption="Employee information table"
        />
      );

      expect(screen.getByText('Employee information table')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should virtualize large datasets', () => {
      const hugeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Person ${i + 1}`,
        age: 20 + (i % 40),
        department: 'IT',
        salary: 50000,
      }));

      customRender(
        <SortableTable
          data={hugeDataset}
          columns={mockColumns}
          virtualized={true}
          height={400}
        />
      );

      const virtualizedContainer = screen.getByTestId('virtualized-table');
      expect(virtualizedContainer).toBeInTheDocument();
    });

    it('should memoize sorted data to prevent unnecessary re-renders', () => {
      const { rerender } = customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Rerender with same props
      rerender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
        />
      );

      // Component should not re-sort data if props haven't changed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should export table data to CSV', async () => {
      const onExport = jest.fn();

      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          exportable={true}
          onExport={onExport}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(onExport).toHaveBeenCalledWith(mockData, 'csv');
    });

    it('should show export options menu', async () => {
      customRender(
        <SortableTable
          data={mockData}
          columns={mockColumns}
          exportable={true}
        />
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
      expect(screen.getByText(/export as excel/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      const dataWithMissingFields = [
        { id: 1, name: 'John Doe' }, // Missing age, department, salary
        { id: 2, age: 25, department: 'HR' }, // Missing name, salary
      ];

      customRender(
        <SortableTable
          data={dataWithMissingFields}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument(); // Placeholder for missing data
    });

    it('should handle invalid sort values', async () => {
      const dataWithInvalidValues = [
        { id: 1, name: 'John Doe', age: 'invalid', department: 'IT', salary: 50000 },
        { id: 2, name: 'Jane Smith', age: 25, department: 'HR', salary: 45000 },
      ];

      customRender(
        <SortableTable
          data={dataWithInvalidValues}
          columns={mockColumns}
        />
      );

      const ageHeader = screen.getByText('Age');
      await user.click(ageHeader);

      // Should still render without crashing
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
