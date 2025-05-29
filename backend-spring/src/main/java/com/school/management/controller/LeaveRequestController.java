package com.school.management.controller;

import com.school.management.entity.Employee;
import com.school.management.entity.LeaveRequest;
import com.school.management.entity.LeaveStatus;
import com.school.management.service.EmployeeService;
import com.school.management.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/leaverequests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final EmployeeService employeeService;

    // Employee, Manager, Admin: submit a leave request
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    @PostMapping
    public ResponseEntity<LeaveRequest> createLeaveRequest(@Valid @RequestBody LeaveRequest leaveRequest) {
        // Link the leave request to the employee submitting (can improve by getting employee from JWT)
        if (leaveRequest.getEmployee() == null || leaveRequest.getEmployee().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Optional<Employee> empOpt = employeeService.findById(leaveRequest.getEmployee().getId());
        if (empOpt.isEmpty()) return ResponseEntity.badRequest().build();

        leaveRequest.setEmployee(empOpt.get());
        leaveRequest.setStatus(LeaveStatus.PENDING); // Always pending initially
        LeaveRequest saved = leaveRequestService.save(leaveRequest);
        return ResponseEntity.ok(saved);
    }

    // Manager, Admin: view all leave requests
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping
    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestService.findAll();
    }

    // Employee, Manager, Admin: view leave requests for an employee
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsForEmployee(@PathVariable Long employeeId) {
        Optional<Employee> employee = employeeService.findById(employeeId);
        return employee.map(e -> ResponseEntity.ok(leaveRequestService.findByEmployee(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    // Admin, Manager: approve or reject a leave request
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<LeaveRequest> updateLeaveRequestStatus(@PathVariable Long id, @RequestParam LeaveStatus status) {
        return leaveRequestService.findById(id).map(req -> {
            req.setStatus(status);
            return ResponseEntity.ok(leaveRequestService.save(req));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Employee, Manager, Admin: delete own pending leave request
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOwnPendingLeaveRequest(@PathVariable Long id) {
        Optional<LeaveRequest> request = leaveRequestService.findById(id);
        if (request.isPresent() && request.get().getStatus() == LeaveStatus.PENDING) {
            leaveRequestService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.badRequest().build();
    }
}
