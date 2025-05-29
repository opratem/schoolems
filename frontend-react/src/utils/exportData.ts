import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

// Define types for table export
interface TableColumn {
  header: string;
  accessor: string;
}

/**
 * Convert data to CSV format and download it
 * @param data The data to export
 * @param columns The columns to include in the export
 * @param filename The name of the file to download
 */
export const exportToCSV = (data: any[], columns: TableColumn[], filename: string) => {
  // Create column headers
  const header = columns.map(column => `"${column.header}"`).join(',');

  // Create rows
  const rows = data.map(item => {
    return columns.map(column => {
      const value = getValueByPath(item, column.accessor);
      // Wrap in quotes to handle commas in values
      return `"${value !== null && value !== undefined ? value : ''}"`;
    }).join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create a blob and download it
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${dayjs().format('YYYY-MM-DD')}.csv`);
};

/**
 * Export data to PDF and download it
 * @param data The data to export
 * @param columns The columns to include in the export
 * @param filename The name of the file to download
 * @param title Title of the PDF document
 */
export const exportToPDF = (data: any[], columns: TableColumn[], filename: string, title: string) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 22);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${dayjs().format('YYYY-MM-DD')}`, 14, 30);

  // Create table data
  const headers = columns.map(column => column.header);
  const rows = data.map(item => {
    return columns.map(column => {
      const value = getValueByPath(item, column.accessor);
      return value !== null && value !== undefined ? value : '';
    });
  });

  // Add table
  (doc as any).autoTable({
    head: [headers],
    body: rows,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [25, 118, 210], textColor: 255 }
  });

  // Save the PDF
  doc.save(`${filename}_${dayjs().format('YYYY-MM-DD')}.pdf`);
};

/**
 * Util function to get a nested property value from an object using dot notation
 * @param obj The object to get the value from
 * @param path The path to the property, e.g. "employee.name"
 * @returns The property value or null if not found
 */
const getValueByPath = (obj: any, path: string): any => {
  // Split path by dots to handle nested properties
  const keys = path.split('.');
  let value = obj;

  // Navigate through the object
  for (const key of keys) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return null;
    }
    value = value[key];
  }

  return value;
};
