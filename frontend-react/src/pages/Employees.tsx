import type React from "react";
import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Box,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete, GetApp } from "@mui/icons-material";
import api from "../api/axios";
import dayjs from "dayjs";
import ConfirmationDialog from "../components/ConfirmationDialog";
import SortableTable, { Column } from "../components/SortableTable";
import TableFilters, { FilterOption, FilterValues } from "../components/TableFilters";
import { exportToCSV, exportToPDF } from "../utils/exportData";

// Employee data type
interface Employee {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  contactInfo: string;
  startDate: string;
}

const initForm: Omit<Employee, "id"> = {
  name: "",
  employeeId: "",
  department: "",
  position: "",
  contactInfo: "",
  startDate: dayjs().format("YYYY-MM-DD"),
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [snack, setSnack] = useState<{msg: string; type: "success" | "error"} | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (e: any) {
      setSnack({ msg: "Failed to load employees", type: "error" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const validate = (data = form) => {
    const errs: any = {};
    if (!data.name) errs.name = "Required";
    if (!data.employeeId) errs.employeeId = "Required";
    if (!data.department) errs.department = "Required";
    if (!data.position) errs.position = "Required";
    if (!data.contactInfo) errs.contactInfo = "Required";
    if (!data.startDate || !/\d{4}-\d{2}-\d{2}/.test(data.startDate)) errs.startDate = "Valid Date Required";
    else if (dayjs(data.startDate).isAfter(dayjs())) errs.startDate = "StartDate can't be in the future";
    return errs;
  };

  const handleOpen = (emp?: Employee) => {
    setEditId(emp?.id ?? null);
    setForm(emp ? {
      name: emp.name,
      employeeId: emp.employeeId,
      department: emp.department,
      position: emp.position,
      contactInfo: emp.contactInfo,
      startDate: emp.startDate,
    } : { ...initForm });
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => { setOpen(false); setEditId(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      if (editId) {
        await api.put(`/employees/${editId}`, form);
        setSnack({ msg: "Employee updated", type: "success" });
      } else {
        await api.post("/employees", form);
        setSnack({ msg: "Employee created", type: "success" });
      }
      handleClose();
      fetchEmployees();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e.message || "Failed to save";
      setSnack({ msg, type: "error" });
    }
  };

  const confirmDeleteEmployee = (id: number) => {
    setConfirmDelete(id);
  };

  const handleDelete = async (id: number) => {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await api.delete(`/employees/${id}`);
      setSnack({ msg: "Employee deleted successfully", type: "success" });
      fetchEmployees();
    } catch (e: any) {
      setSnack({ msg: "Delete failed", type: "error" });
    }
    setDeleting(null);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      id: 'department',
      label: 'Department',
      type: 'multiSelect',
      options: [...new Set(employees.map(emp => emp.department))].map(dept => ({
        value: dept,
        label: dept
      }))
    },
    {
      id: 'position',
      label: 'Position',
      type: 'multiSelect',
      options: [...new Set(employees.map(emp => emp.position))].map(pos => ({
        value: pos,
        label: pos
      }))
    },
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'dateRange'
    }
  ];

  // Define table columns
  const columns: Column<Employee>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      id: 'employeeId',
      label: 'Employee ID',
      sortable: true,
    },
    {
      id: 'department',
      label: 'Department',
      sortable: true,
    },
    {
      id: 'position',
      label: 'Position',
      sortable: true,
    },
    {
      id: 'contactInfo',
      label: 'Contact Info',
      sortable: true,
    },
    {
      id: 'startDate',
      label: 'Start Date',
      sortable: true,
      format: (value) => dayjs(value).format("YYYY-MM-DD"),
    },
    {
      id: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (emp: Employee) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton color="primary" onClick={() => handleOpen(emp)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              disabled={deleting === emp.id}
              onClick={() => confirmDeleteEmployee(emp.id)}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // Apply filters to employee data
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search filter
      const searchMatch = searchTerm === "" ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.contactInfo.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Department filter
      if (filterValues.department && Array.isArray(filterValues.department) && filterValues.department.length > 0) {
        if (!filterValues.department.includes(emp.department)) return false;
      }

      // Position filter
      if (filterValues.position && Array.isArray(filterValues.position) && filterValues.position.length > 0) {
        if (!filterValues.position.includes(emp.position)) return false;
      }

      // Date range filter
      if (filterValues.startDate?.from || filterValues.startDate?.to) {
        const empDate = dayjs(emp.startDate);
        if (filterValues.startDate.from && empDate.isBefore(dayjs(filterValues.startDate.from))) return false;
        if (filterValues.startDate.to && empDate.isAfter(dayjs(filterValues.startDate.to))) return false;
      }

      return true;
    });
  }, [employees, searchTerm, filterValues]);

  const handleExportToCSV = () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Employee ID', accessor: 'employeeId' },
      { header: 'Department', accessor: 'department' },
      { header: 'Position', accessor: 'position' },
      { header: 'Contact Info', accessor: 'contactInfo' },
      { header: 'Start Date', accessor: 'startDate' }
    ];

    exportToCSV(filteredEmployees, columns, 'employees');
    handleExportClose();
    setSnack({ msg: "Employees exported to CSV successfully", type: "success" });
  };

  const handleExportToPDF = () => {
    const columns = [
      { header: 'Name', accessor: 'name' },
      { header: 'Employee ID', accessor: 'employeeId' },
      { header: 'Department', accessor: 'department' },
      { header: 'Position', accessor: 'position' },
      { header: 'Contact Info', accessor: 'contactInfo' },
      { header: 'Start Date', accessor: 'startDate' }
    ];

    exportToPDF(filteredEmployees, columns, 'employees', 'Employees List');
    handleExportClose();
    setSnack({ msg: "Employees exported to PDF successfully", type: "success" });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mt: 6, mb: 2 }}>Employees</Typography>

      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportClick}
            aria-controls="export-menu"
            aria-haspopup="true"
          >
            Export
          </Button>
          <Menu
            id="export-menu"
            anchorEl={exportMenuAnchor}
            keepMounted
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleExportToCSV}>Export to CSV</MenuItem>
            <MenuItem onClick={handleExportToPDF}>Export to PDF</MenuItem>
          </Menu>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Employee
          </Button>
        </Box>
      </Box>

      <TableFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employees by name, ID, department, position, or contact..."
        filters={filterOptions}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        onClearFilters={() => setFilterValues({})}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <SortableTable
          data={filteredEmployees}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          emptyMessage={employees.length === 0 ? "No employees found" : "No employees match your filters"}
          enablePagination={true}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
      {/* Dialog for Add/Edit */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              label="Employee ID"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              error={!!errors.employeeId}
              helperText={errors.employeeId}
              required
            />
            <TextField
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              error={!!errors.department}
              helperText={errors.department}
              required
            />
            <TextField
              label="Position"
              name="position"
              value={form.position}
              onChange={handleChange}
              error={!!errors.position}
              helperText={errors.position}
              required
            />
            <TextField
              label="Contact Info"
              name="contactInfo"
              value={form.contactInfo}
              onChange={handleChange}
              error={!!errors.contactInfo}
              helperText={errors.contactInfo}
              required
            />
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              error={!!errors.startDate}
              helperText={errors.startDate}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>{editId ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for success/error */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack && <Alert severity={snack.type} onClose={() => setSnack(null)}>{snack.msg}</Alert>}
      </Snackbar>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDelete !== null}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone."
        confirmText="Delete"
        severity="error"
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </Container>
  );
}
