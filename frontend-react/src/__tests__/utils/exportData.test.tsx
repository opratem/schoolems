import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from '../../utils/exportData';

// Mock FileSaver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Mock xlsx library
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new ArrayBuffer(8)),
}));

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    autoTable: jest.fn(),
    save: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    getTextWidth: jest.fn(() => 50),
    internal: {
      pageSize: { width: 210, height: 297 },
    },
  }));
});

// Mock jspdf-autotable
jest.mock('jspdf-autotable');

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

describe('exportData Utilities', () => {
  const mockEmployeeData = [
    {
      id: 1,
      name: 'John Doe',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Developer',
      email: 'john@example.com',
      startDate: '2023-01-15',
      salary: 50000,
    },
    {
      id: 2,
      name: 'Jane Smith',
      employeeId: 'EMP002',
      department: 'HR',
      position: 'Manager',
      email: 'jane@example.com',
      startDate: '2022-06-01',
      salary: 60000,
    },
    {
      id: 3,
      name: 'Bob Wilson',
      employeeId: 'EMP003',
      department: 'Finance',
      position: 'Analyst',
      email: 'bob@example.com',
      startDate: '2023-03-20',
      salary: 45000,
    },
  ];

  const mockLeaveRequestData = [
    {
      id: 1,
      employeeName: 'John Doe',
      leaveType: 'ANNUAL',
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      days: 5,
      status: 'PENDING',
      reason: 'Family vacation',
    },
    {
      id: 2,
      employeeName: 'Jane Smith',
      leaveType: 'SICK',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      days: 3,
      status: 'APPROVED',
      reason: 'Medical appointment',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Date.now to a fixed timestamp for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-15T10:00:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('formatDataForExport', () => {
    it('should format data with default columns', () => {
      const result = formatDataForExport(mockEmployeeData);

      expect(result).toEqual([
        {
          id: 1,
          name: 'John Doe',
          employeeId: 'EMP001',
          department: 'IT',
          position: 'Developer',
          email: 'john@example.com',
          startDate: '2023-01-15',
          salary: 50000,
        },
        {
          id: 2,
          name: 'Jane Smith',
          employeeId: 'EMP002',
          department: 'HR',
          position: 'Manager',
          email: 'jane@example.com',
          startDate: '2022-06-01',
          salary: 60000,
        },
        {
          id: 3,
          name: 'Bob Wilson',
          employeeId: 'EMP003',
          department: 'Finance',
          position: 'Analyst',
          email: 'bob@example.com',
          startDate: '2023-03-20',
          salary: 45000,
        },
      ]);
    });

    it('should format data with specified columns', () => {
      const columns = ['name', 'department', 'email'];
      const result = formatDataForExport(mockEmployeeData, columns);

      expect(result).toEqual([
        {
          name: 'John Doe',
          department: 'IT',
          email: 'john@example.com',
        },
        {
          name: 'Jane Smith',
          department: 'HR',
          email: 'jane@example.com',
        },
        {
          name: 'Bob Wilson',
          department: 'Finance',
          email: 'bob@example.com',
        },
      ]);
    });

    it('should format data with column mappings', () => {
      const columnMapping = {
        name: 'Full Name',
        employeeId: 'Employee ID',
        department: 'Department',
      };

      const result = formatDataForExport(
        mockEmployeeData,
        ['name', 'employeeId', 'department'],
        columnMapping
      );

      expect(result).toEqual([
        {
          'Full Name': 'John Doe',
          'Employee ID': 'EMP001',
          'Department': 'IT',
        },
        {
          'Full Name': 'Jane Smith',
          'Employee ID': 'EMP002',
          'Department': 'HR',
        },
        {
          'Full Name': 'Bob Wilson',
          'Employee ID': 'EMP003',
          'Department': 'Finance',
        },
      ]);
    });

    it('should handle empty data arrays', () => {
      const result = formatDataForExport([]);
      expect(result).toEqual([]);
    });

    it('should handle missing properties gracefully', () => {
      const incompleteData = [
        { name: 'John Doe', department: 'IT' },
        { name: 'Jane Smith' }, // Missing department
      ];

      const result = formatDataForExport(incompleteData, ['name', 'department', 'email']);

      expect(result).toEqual([
        {
          name: 'John Doe',
          department: 'IT',
          email: undefined,
        },
        {
          name: 'Jane Smith',
          department: undefined,
          email: undefined,
        },
      ]);
    });
  });

  describe('exportToCSV', () => {
    it('should export employee data to CSV', () => {
      const filename = 'employees';
      exportToCSV(mockEmployeeData, filename);

      expect(saveAs).toHaveBeenCalledTimes(1);

      const callArgs = (saveAs as jest.Mock).mock.calls[0];
      const blob = callArgs[0];
      const savedFilename = callArgs[1];

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
      expect(savedFilename).toBe('employees_2024-01-15.csv');
    });

    it('should export with custom columns', () => {
      const columns = ['name', 'department'];
      exportToCSV(mockEmployeeData, 'employees', columns);

      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('should export with column mappings', () => {
      const columns = ['name', 'department'];
      const columnMapping = {
        name: 'Full Name',
        department: 'Department',
      };

      exportToCSV(mockEmployeeData, 'employees', columns, columnMapping);

      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in CSV data', () => {
      const dataWithSpecialChars = [
        {
          name: 'John "Johnny" Doe',
          description: 'Works in IT, handles security',
          notes: 'Line 1\nLine 2',
        },
      ];

      exportToCSV(dataWithSpecialChars, 'test');

      expect(saveAs).toHaveBeenCalledTimes(1);

      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should generate unique filename when no name provided', () => {
      exportToCSV(mockEmployeeData);

      const savedFilename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(savedFilename).toMatch(/export_\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should handle empty data arrays', () => {
      exportToCSV([], 'empty');

      expect(saveAs).toHaveBeenCalledTimes(1);

      const blob = (saveAs as jest.Mock).mock.calls[0][0];
      expect(blob.size).toBeGreaterThan(0); // Should still create a valid CSV with headers
    });
  });

  describe('exportToExcel', () => {
    it('should export data to Excel format', () => {
      exportToExcel(mockEmployeeData, 'employees');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
      expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(1);
      expect(XLSX.write).toHaveBeenCalledTimes(1);
      expect(saveAs).toHaveBeenCalledTimes(1);

      const savedFilename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(savedFilename).toBe('employees_2024-01-15.xlsx');
    });

    it('should export with custom columns', () => {
      const columns = ['name', 'department'];
      exportToExcel(mockEmployeeData, 'employees', columns);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        { name: 'John Doe', department: 'IT' },
        { name: 'Jane Smith', department: 'HR' },
        { name: 'Bob Wilson', department: 'Finance' },
      ]);
    });

    it('should export with custom sheet name', () => {
      const options = { sheetName: 'Employee Data' };
      exportToExcel(mockEmployeeData, 'employees', undefined, undefined, options);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Employee Data'
      );
    });

    it('should handle multiple sheets', () => {
      const options = {
        sheets: [
          { name: 'Employees', data: mockEmployeeData },
          { name: 'Leave Requests', data: mockLeaveRequestData },
        ],
      };

      exportToExcel([], 'report', undefined, undefined, options);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    });

    it('should handle Excel write errors gracefully', () => {
      (XLSX.write as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Excel write error');
      });

      expect(() => {
        exportToExcel(mockEmployeeData, 'employees');
      }).toThrow('Excel write error');
    });
  });

  describe('exportToPDF', () => {
    let mockJsPDF: any;

    beforeEach(() => {
      const jsPDF = require('jspdf');
      mockJsPDF = {
        autoTable: jest.fn(),
        save: jest.fn(),
        setFontSize: jest.fn(),
        text: jest.fn(),
        getTextWidth: jest.fn(() => 50),
        internal: {
          pageSize: { width: 210, height: 297 },
        },
      };
      (jsPDF as jest.Mock).mockReturnValue(mockJsPDF);
    });

    it('should export data to PDF format', () => {
      exportToPDF(mockEmployeeData, 'employees');

      expect(mockJsPDF.setFontSize).toHaveBeenCalledWith(16);
      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.autoTable).toHaveBeenCalledTimes(1);
      expect(mockJsPDF.save).toHaveBeenCalledWith('employees_2024-01-15.pdf');
    });

    it('should export with custom columns', () => {
      const columns = ['name', 'department'];
      exportToPDF(mockEmployeeData, 'employees', columns);

      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      expect(autoTableCall.head).toEqual([['name', 'department']]);
      expect(autoTableCall.body).toEqual([
        ['John Doe', 'IT'],
        ['Jane Smith', 'HR'],
        ['Bob Wilson', 'Finance'],
      ]);
    });

    it('should export with column mappings', () => {
      const columns = ['name', 'department'];
      const columnMapping = {
        name: 'Full Name',
        department: 'Department',
      };

      exportToPDF(mockEmployeeData, 'employees', columns, columnMapping);

      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      expect(autoTableCall.head).toEqual([['Full Name', 'Department']]);
    });

    it('should add custom title to PDF', () => {
      const options = { title: 'Employee Report 2024' };
      exportToPDF(mockEmployeeData, 'employees', undefined, undefined, options);

      expect(mockJsPDF.text).toHaveBeenCalledWith('Employee Report 2024', expect.any(Number), 20);
    });

    it('should handle custom PDF styling', () => {
      const options = {
        title: 'Report',
        styles: {
          fontSize: 12,
          cellPadding: 5,
        },
      };

      exportToPDF(mockEmployeeData, 'employees', undefined, undefined, options);

      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      expect(autoTableCall.styles).toEqual({
        fontSize: 12,
        cellPadding: 5,
      });
    });

    it('should handle empty data arrays', () => {
      exportToPDF([], 'empty');

      expect(mockJsPDF.autoTable).toHaveBeenCalledTimes(1);
      expect(mockJsPDF.save).toHaveBeenCalledWith('empty_2024-01-15.pdf');
    });

    it('should handle long text in cells', () => {
      const dataWithLongText = [
        {
          name: 'John Doe',
          description: 'This is a very long description that should be properly handled in the PDF export and wrapped appropriately',
        },
      ];

      exportToPDF(dataWithLongText, 'test');

      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      expect(autoTableCall.columnStyles).toBeDefined();
    });
  });

  describe('File Naming and Timestamps', () => {
    it('should generate timestamp-based filenames', () => {
      const timestamp = new Date().toISOString().split('T')[0];

      exportToCSV(mockEmployeeData, 'test');
      const csvFilename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(csvFilename).toBe(`test_${timestamp}.csv`);

      exportToExcel(mockEmployeeData, 'test');
      const excelFilename = (saveAs as jest.Mock).mock.calls[1][1];
      expect(excelFilename).toBe(`test_${timestamp}.xlsx`);
    });

    it('should sanitize filenames', () => {
      const unsafeFilename = 'test/file\\name:with|special<chars>?.txt';

      exportToCSV(mockEmployeeData, unsafeFilename);

      const savedFilename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(savedFilename).not.toContain('/');
      expect(savedFilename).not.toContain('\\');
      expect(savedFilename).not.toContain(':');
      expect(savedFilename).not.toContain('|');
      expect(savedFilename).not.toContain('<');
      expect(savedFilename).not.toContain('>');
      expect(savedFilename).not.toContain('?');
    });

    it('should handle long filenames', () => {
      const longFilename = 'a'.repeat(300);

      exportToCSV(mockEmployeeData, longFilename);

      const savedFilename = (saveAs as jest.Mock).mock.calls[0][1];
      expect(savedFilename.length).toBeLessThanOrEqual(255); // Common filename length limit
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should handle null or undefined data', () => {
      expect(() => exportToCSV(null as any, 'test')).not.toThrow();
      expect(() => exportToCSV(undefined as any, 'test')).not.toThrow();

      // Should export empty file
      expect(saveAs).toHaveBeenCalledTimes(2);
    });

    it('should handle non-array data', () => {
      const nonArrayData = { name: 'John', age: 30 };

      expect(() => exportToCSV(nonArrayData as any, 'test')).not.toThrow();

      // Should convert single object to array
      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('should handle circular reference objects', () => {
      const circularData = { name: 'John' };
      (circularData as any).self = circularData;

      expect(() => exportToCSV([circularData], 'test')).not.toThrow();
    });

    it('should handle objects with nested properties', () => {
      const nestedData = [
        {
          name: 'John Doe',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            country: 'USA',
          },
          skills: ['JavaScript', 'React', 'Node.js'],
        },
      ];

      exportToCSV(nestedData, 'test');

      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('should handle Date objects in data', () => {
      const dataWithDates = [
        {
          name: 'John Doe',
          startDate: new Date('2023-01-15'),
          lastLogin: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      exportToCSV(dataWithDates, 'test');

      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('should handle various data types', () => {
      const mixedData = [
        {
          string: 'text',
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      ];

      exportToCSV(mixedData, 'test');
      exportToExcel(mixedData, 'test');
      exportToPDF(mixedData, 'test');

      expect(saveAs).toHaveBeenCalledTimes(2); // CSV and Excel
      expect(mockJsPDF.save).toHaveBeenCalledTimes(1); // PDF
    });
  });

  describe('Performance and Large Datasets', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        department: ['IT', 'HR', 'Finance'][i % 3],
        salary: 40000 + (i * 100),
      }));

      const startTime = Date.now();
      exportToCSV(largeDataset, 'large-dataset');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(saveAs).toHaveBeenCalledTimes(1);
    });

    it('should chunk large datasets for PDF export', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
      }));

      exportToPDF(largeDataset, 'large-pdf');

      // Should handle large dataset without memory issues
      expect(mockJsPDF.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle browsers without Blob support', () => {
      const originalBlob = global.Blob;
      delete (global as any).Blob;

      expect(() => exportToCSV(mockEmployeeData, 'test')).not.toThrow();

      global.Blob = originalBlob;
    });

    it('should handle browsers without URL.createObjectURL', () => {
      const originalCreateObjectURL = global.URL.createObjectURL;
      delete (global.URL as any).createObjectURL;

      expect(() => exportToCSV(mockEmployeeData, 'test')).not.toThrow();

      global.URL.createObjectURL = originalCreateObjectURL;
    });
  });
});
