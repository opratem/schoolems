import type React from "react";
import { useEffect, useState, useContext, useMemo } from "react";
import {
  Container, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Snackbar, Alert, Box, CircularProgress, Select, MenuItem,
  InputLabel, FormControl, Tooltip, Chip, Menu
} from "@mui/material";
import { Add, Delete, Done, Close, Send, GetApp } from "@mui/icons-material";
import api from "../api/axios";
import dayjs from "dayjs";
import { AuthContext } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import ConfirmationDialog from "../components/ConfirmationDialog";
import SortableTable, { Column } from "../components/SortableTable";
import TableFilters, { FilterOption, FilterValues } from "../components/TableFilters";
import { exportToCSV, exportToPDF } from "../utils/exportData";

interface Employee { id: number; name: string; }
interface LeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employee: Employee;
}

// Update leave types to match backend
const LEAVE_TYPES = ["ANNUAL", "SICK", "UNPAID", "OTHER"];

export default function LeaveRequests() {
  const location = useLocation();
  const { user, isAdmin, isManager, isEmployee } = useContext(AuthContext) || {};
  const [leaveReqs, setLeaveReqs] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]); // For admin/manager assignment
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: "ANNUAL",
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    reason: "",
    employeeId: user?.employeeId || ""
  });
  const [errors, setErrors] = useState<any>({});
  const [snack, setSnack] = useState<{ msg: string, type: "success" | "error" } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [approving, setApproving] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [confirmApprove, setConfirmApprove] = useState<number | null>(null);
  const [confirmReject, setConfirmReject] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      id: 'leaveType',
      label: 'Leave Type',
      type: 'multiSelect',
      options: LEAVE_TYPES.map(type => ({ value: type, label: type }))
    },
    {
      id: 'status',
      label: 'Status',
      type: 'multiSelect',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' }
      ]
    },
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'dateRange'
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'dateRange'
    }
  ];

  // Define table columns
  const columns: Column<LeaveRequest>[] = [
    {
      id: 'employee.name',
      label: 'Employee',
      sortable: true,
      format: (value, row) => row.employee?.name || '',
    },
    {
      id: 'leaveType',
      label: 'Leave Type',
      sortable: true,
    },
    {
      id: 'startDate',
      label: 'Start Date',
      sortable: true,
      format: (value) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      id: 'endDate',
      label: 'End Date',
      sortable: true,
      format: (value) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      id: 'reason',
      label: 'Reason',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (lr: LeaveRequest) => (
        <Chip
          label={lr.status}
          color={
            lr.status === "APPROVED" ? "success" :
            lr.status === "REJECTED" ? "error" :
            "warning"
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'actions',
      label: isAdmin || isManager ? 'Actions' : 'Delete',
      sortable: false,
      align: 'right',
      render: (lr: LeaveRequest) => (
        <Box>
          {isAdmin || isManager ? (
            lr.status === "PENDING" && (
              <>
                <Tooltip title="Approve">
                  <IconButton
                    color="success"
                    disabled={approving === lr.id}
                    onClick={() => confirmApproveRequest(lr.id)}
                  >
                    <Done />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reject">
                  <IconButton
                    color="error"
                    disabled={approving === lr.id}
                    onClick={() => confirmRejectRequest(lr.id)}
                  >
                    <Close />
                  </IconButton>
                </Tooltip>
              </>
            )
          ) : (
            lr.status === "PENDING" && (
              <Tooltip title="Delete">
                <IconButton
                  color="error"
                  disabled={deleting === lr.id}
                  onClick={() => confirmDeleteRequest(lr.id)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )
          )}
        </Box>
      ),
    },
  ];

  // Apply filters to leave request data
  const filteredLeaveRequests = useMemo(() => {
    return leaveReqs.filter(lr => {
      // Search filter
      const searchMatch = searchTerm === "" ||
        (lr.employee?.name && lr.employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        lr.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lr.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lr.status.toLowerCase().includes(searchTerm.toLowerCase());

      if (!searchMatch) return false;

      // Leave type filter
      if (filterValues.leaveType && Array.isArray(filterValues.leaveType) && filterValues.leaveType.length > 0) {
        if (!filterValues.leaveType.includes(lr.leaveType)) return false;
      }

      // Status filter
      if (filterValues.status && Array.isArray(filterValues.status) && filterValues.status.length > 0) {
        if (!filterValues.status.includes(lr.status)) return false;
      }

      // Start date range filter
      if (filterValues.startDate?.from || filterValues.startDate?.to) {
        const startDate = dayjs(lr.startDate);
        if (filterValues.startDate.from && startDate.isBefore(dayjs(filterValues.startDate.from))) return false;
        if (filterValues.startDate.to && startDate.isAfter(dayjs(filterValues.startDate.to))) return false;
      }

      // End date range filter
      if (filterValues.endDate?.from || filterValues.endDate?.to) {
        const endDate = dayjs(lr.endDate);
        if (filterValues.endDate.from && endDate.isBefore(dayjs(filterValues.endDate.from))) return false;
        if (filterValues.endDate.to && endDate.isAfter(dayjs(filterValues.endDate.to))) return false;
      }

      return true;
    });
  }, [leaveReqs, searchTerm, filterValues, isAdmin, isManager]);

  // Additional debug effect to log user and employee info
  useEffect(() => {
    console.log("Current user:", user);
    console.log("User roles:", { isAdmin, isManager, isEmployee });
    console.log("User employeeId:", user?.employeeId);
    // Check localStorage for token
    console.log("Auth token exists:", !!localStorage.getItem('token'));
  }, [user, isAdmin, isManager, isEmployee]);

  const fetchLeaveReqs = async () => {
    setLoading(true);
    try {
      let res;
      // First check using the isAdmin and isManager properties directly
      if (isAdmin || isManager) {
        console.log("Fetching all leave requests as admin or manager");
        res = await api.get("/leaverequests");
      } else if (isEmployee && user?.employeeId) {
        console.log("Fetching employee-specific leave requests");
        res = await api.get(`/leaverequests/employee/${user.employeeId}`);
      } else {
        console.log("No role matched or no employee ID, returning empty array");
        res = { data: [] };
      }
      console.log("Leave requests data:", res.data);
      setLeaveReqs(res.data);
    } catch (e: any) {
      console.error("Error fetching leave requests:", e);
      setSnack({ msg: "Failed to load leave requests", type: "error" });
    }
    setLoading(false);
  };

  // For possible assignment (not needed for normal employee)
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data.map((e: any) => ({ id: e.id, name: e.name })));
    } catch (e) {
      console.error("Error fetching employees:", e);
    }
  };

  useEffect(() => {
    console.log("Running main useEffect with roles:", { isAdmin, isManager, isEmployee });
    fetchLeaveReqs();
    if (isAdmin || isManager) fetchEmployees();
  }, [user, isAdmin, isManager, isEmployee]);

  // Check if we should open the modal on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'submit') {
      handleOpen();
    }
    // eslint-disable-next-line
  }, [location]);

  const validate = (data = form) => {
    const errs: any = {};
    if (!data.leaveType) errs.leaveType = "Required";
    if (!data.reason) errs.reason = "Required";
    if (!data.startDate || !/\d{4}-\d{2}-\d{2}/.test(data.startDate)) errs.startDate = "Required";
    if (!data.endDate || !/\d{4}-\d{2}-\d{2}/.test(data.endDate)) errs.endDate = "Required";
    if (dayjs(data.startDate).isAfter(dayjs(data.endDate))) errs.endDate = "End before Start";
    if (!isAdmin && !isManager && !user?.employeeId) errs.employeeId = "Unknown Employee";
    return errs;
  };

  const handleOpen = () => {
    setForm({
      leaveType: "ANNUAL",
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: dayjs().format("YYYY-MM-DD"),
      reason: "",
      employeeId: user?.employeeId || ""
    });
    setErrors({});
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement|{name?:string;value:unknown}>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name!] : value }));
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    // Prevent default if it's a form submission
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }

    console.log("Submit function called");
    console.log("Current form data:", form);

    // Don't allow multiple submissions
    if (submitting) {
      console.log("Already submitting, ignoring request");
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      console.log("Validation errors:", errs);
      setErrors(errs);
      return;
    }

    // Get employeeId from user context if not set
    const employeeId = form.employeeId || user?.employeeId;
    console.log("Using employeeId:", employeeId);

    if (!employeeId && !isAdmin && !isManager) {
      console.log("Missing employeeId and user is not admin/manager");
      setSnack({
        msg: "Employee ID is missing. Please try logging out and back in.",
        type: "error"
      });
      return;
    }

    setSubmitting(true);
    console.log("Starting submission process");

    try {
      // Format dates as ISO strings for the backend (LocalDate expects YYYY-MM-DD)
      const startDate = dayjs(form.startDate).format('YYYY-MM-DD');
      const endDate = dayjs(form.endDate).format('YYYY-MM-DD');

      // Create the request body
      const reqBody = {
        leaveType: form.leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: form.reason,
        employee: {
          id: isAdmin || isManager ? Number(form.employeeId) : Number(employeeId)
        },
        status: "PENDING" // Explicitly set status
      };

      console.log("Sending request with body:", JSON.stringify(reqBody));
      console.log("Token being used:", localStorage.getItem('token'));

      // Make the API call with explicit content type and credentials
      const response = await api.post("/leaverequests", reqBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true
      });

      console.log("Response received:", response);
      setSnack({ msg: "Request submitted successfully", type: "success" });
      handleClose();
      fetchLeaveReqs();
    } catch (e: any) {
      console.error("Submission error:", e);
      let errorMessage = "Failed to submit leave request. Please try again.";

      if (e.response) {
        console.log("Error response status:", e.response.status);
        console.log("Error response data:", e.response.data);

        if (e.response.status === 400) {
          errorMessage = "Invalid request format. Check your form data.";
        } else if (e.response.status === 401 || e.response.status === 403) {
          errorMessage = "You don't have permission to submit leave requests.";
          setTimeout(() => window.location.reload(), 2000);
        } else if (e.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }

        if (e.response.data && e.response.data.message) {
          errorMessage = e.response.data.message;
        }
      } else if (e.request) {
        console.log("No response received");
        errorMessage = "No response from server. Check your connection.";
      }

      setSnack({
        msg: errorMessage,
        type: "error"
      });
    } finally {
      console.log("Submission process completed");
      setSubmitting(false);
    }
  };

  const confirmDeleteRequest = (id: number) => {
    setConfirmDelete(id);
  };

  const confirmApproveRequest = (id: number) => {
    setConfirmApprove(id);
  };

  const confirmRejectRequest = (id: number) => {
    setConfirmReject(id);
  };

  const handleDelete = async (id: number) => {
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await api.delete(`/leaverequests/${id}`);
      setSnack({ msg: "Leave request deleted successfully", type: "success" });
      fetchLeaveReqs();
    } catch {
      setSnack({ msg: "Delete failed", type: "error" });
    }
    setDeleting(null);
  };

  const handleStatus = async (id: number, status: "APPROVED"|"REJECTED") => {
    if (status === "APPROVED") setConfirmApprove(null);
    if (status === "REJECTED") setConfirmReject(null);

    setApproving(id);
    try {
      await api.put(`/leaverequests/${id}/status?status=${status}`);
      setSnack({
        msg: status === "APPROVED" ? "Leave request approved successfully" : "Leave request rejected successfully",
        type: "success"
      });
      fetchLeaveReqs();
    } catch {
      setSnack({ msg: "Failed to update status", type: "error" });
    }
    setApproving(null);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportToCSV = () => {
    const columns = [
      { header: 'Employee', accessor: 'employee.name' },
      { header: 'Leave Type', accessor: 'leaveType' },
      { header: 'Start Date', accessor: 'startDate' },
      { header: 'End Date', accessor: 'endDate' },
      { header: 'Reason', accessor: 'reason' },
      { header: 'Status', accessor: 'status' }
    ];

    exportToCSV(filteredLeaveRequests, columns, 'leave_requests');
    handleExportClose();
    setSnack({ msg: "Leave requests exported to CSV successfully", type: "success" });
  };

  const handleExportToPDF = () => {

    const columns = [
      { header: 'Employee', accessor: 'employee.name' },
      { header: 'Leave Type', accessor: 'leaveType' },
      { header: 'Start Date', accessor: 'startDate' },
      { header: 'End Date', accessor: 'endDate' },
      { header: 'Reason', accessor: 'reason' },
      { header: 'Status', accessor: 'status' }
    ];

    exportToPDF(filteredLeaveRequests, columns, 'leave_requests', 'Leave Requests List');
    handleExportClose();
    setSnack({ msg: "Leave requests exported to PDF successfully", type: "success" });
  };

  // Determine contextual page title
  let pageTitle = "Leave Requests";
  const params = new URLSearchParams(location.search);
  if (params.get('action') === 'submit') {
    pageTitle = "Submit Leave Request";
  } else if (isAdmin || isManager) {
    pageTitle = "All Leave Requests";
  } else if (isEmployee) {
    pageTitle = "My Leave Requests";
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mt: 6, mb: 2 }}>{pageTitle}</Typography>
      <Box sx={{ mb: 3, display: "flex", gap: 1, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={handleExportClick}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportClose}
        >
          <MenuItem onClick={handleExportToCSV}>Export to CSV</MenuItem>
          <MenuItem onClick={handleExportToPDF}>Export to PDF</MenuItem>
        </Menu>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          Submit Request
        </Button>
      </Box>

      <TableFilters
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search leave requests by employee, type, reason, or status..."
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
          data={filteredLeaveRequests}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          emptyMessage={leaveReqs.length === 0 ? "No leave requests found" : "No leave requests match your filters"}
          enablePagination={true}
          defaultRowsPerPage={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
      {/* Dialog for Create */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Submit Leave Request</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel>Leave Type</InputLabel>
                <Select name="leaveType" value={form.leaveType} label="Leave Type" onChange={handleChange} error={!!errors.leaveType}>
                  {LEAVE_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
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
              <TextField
                label="End Date"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                error={!!errors.endDate}
                helperText={errors.endDate}
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                error={!!errors.reason}
                helperText={errors.reason}
                required
                multiline
                minRows={2}
              />
              {(isAdmin || isManager) && (
                <FormControl fullWidth required sx={{ mt: 1 }}>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    name="employeeId"
                    value={form.employeeId}
                    label="Employee"
                    onChange={handleChange}
                    error={!!errors.employeeId}
                  >
                    {employees.map(emp => <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<Send />}
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                px: 3,
                py: 1.2,
                boxShadow: 2
              }}
              disabled={submitting}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={22} color="inherit" sx={{ mr: 1 }} />
                  Submitting...
                </Box>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack && <Alert severity={snack.type} onClose={() => setSnack(null)}>{snack.msg}</Alert>}
      </Snackbar>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={confirmDelete !== null}
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        confirmText="Delete"
        severity="error"
        onConfirm={() => confirmDelete !== null && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmationDialog
        open={confirmApprove !== null}
        title="Approve Leave Request"
        message="Are you sure you want to approve this leave request?"
        confirmText="Approve"
        severity="info"
        onConfirm={() => confirmApprove !== null && handleStatus(confirmApprove, "APPROVED")}
        onCancel={() => setConfirmApprove(null)}
      />

      <ConfirmationDialog
        open={confirmReject !== null}
        title="Reject Leave Request"
        message="Are you sure you want to reject this leave request?"
        confirmText="Reject"
        severity="warning"
        onConfirm={() => confirmReject !== null && handleStatus(confirmReject, "REJECTED")}
        onCancel={() => setConfirmReject(null)}
      />
    </Container>
  );
}
