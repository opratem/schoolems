import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import useLeaveRequests from '../hooks/useLeaveRequests';

function LeaveRequestsPage() {
  const { role } = useAuth();
  const {
    leaveRequests,
    loading,
    submitting,
    filters,
    setFilters,
    submitLeave,
    changeStatus,
    removeRequest
  } = useLeaveRequests();

  const [form, setForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitLeave(form);
    setForm({ type: '', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">
        Leave Requests {role && <small className="text-muted">({role})</small>}
      </h2>

      {role === 'EMPLOYEE' && (
        <form onSubmit={handleSubmit} className="mb-4">
          <h5>Submit Leave Request</h5>
          <div className="row g-2 mb-2">
            <div className="col">
              <select
                name="type"
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="">Select Type</option>
                <option value="SICK">Sick Leave</option>
                <option value="VACATION">Vacation</option>
              </select>
            </div>
            <div className="col">
              <input
                type="date"
                className="form-control"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="col">
              <input
                type="date"
                className="form-control"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mb-2">
            <textarea
              className="form-control"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason"
              required
            />
          </div>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="row mb-3">
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by employee name"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        )}
        <div className="col-md-3">
          <select
            className="form-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="DENIED">Denied</option>
          </select>
        </div>
      </div>

      {/* Leave Table */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Start</th>
            <th>End</th>
            <th>Reason</th>
            <th>Status</th>
            {(role === 'ADMIN' || role === 'MANAGER') && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="text-center">
                Loading...
              </td>
            </tr>
          ) : leaveRequests.length === 0 ? (
            <tr>
              <td colSpan={role === 'ADMIN' || role === 'MANAGER' ? 7 : 6} className="text-center text-muted">
                No leave requests found.
              </td>
            </tr>
          ) : (
            leaveRequests.map((req) => (
              <tr key={req.id}>
                <td>{req.employee?.name || 'You'}</td>
                <td>{req.type}</td>
                <td>{req.startDate}</td>
                <td>{req.endDate}</td>
                <td>{req.reason}</td>
                <td>
                  <span className={`badge ${
                    req.status === 'APPROVED' ? 'bg-success' :
                    req.status === 'DENIED' ? 'bg-danger' :
                    'bg-secondary'
                  }`}>
                    {req.status}
                  </span>
                </td>
                {(role === 'ADMIN' || role === 'MANAGER') && (
                  <td>
                    <button
                      className="btn btn-outline-success btn-sm me-2"
                      onClick={() => changeStatus(req.id, 'APPROVED')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline-warning btn-sm me-2"
                      onClick={() => changeStatus(req.id, 'DENIED')}
                    >
                      Deny
                    </button>
                    {role === 'ADMIN' && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => {
                          setPendingDeleteId(req.id);
                          setShowConfirmModal(true);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Confirm Deletion Modal */}
      {showConfirmModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Deletion</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowConfirmModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  Are you sure you want to delete this leave request?
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      await removeRequest(pendingDeleteId);
                      setShowConfirmModal(false);
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}

export default LeaveRequestsPage;
