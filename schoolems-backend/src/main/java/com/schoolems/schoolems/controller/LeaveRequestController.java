package com.schoolems.schoolems.controller;

import com.schoolems.schoolems.dto.LeaveRequestDTO;
import com.schoolems.schoolems.entity.LeaveRequest;
import com.schoolems.schoolems.entity.LeaveRequest.LeaveStatus;
import com.schoolems.schoolems.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/leave")
@RequiredArgsConstructor
public class LeaveRequestController {
    @Autowired
    private LeaveRequestService leaveRequestService;

    //Admin & Managers can view all leave requests
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<LeaveRequest>> getAllLeaveRequests() {
        return ResponseEntity.ok(leaveRequestService.getAllLeaveRequests());
    }

    //Employee can view thier own leave requests
    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<LeaveRequest>> getMyLeaveRequests(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(leaveRequestService.getLeaveRequestsforEmployee(email));
    }

    //Employee submits a leave request
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<LeaveRequest> submitleaveRequest(
            @RequestBody LeaveRequestDTO dto,
            Authentication authentication) {
        LeaveRequest submitted = leaveRequestService.submitLeaveRequest(dto, authentication);
        return ResponseEntity.ok(submitted);
    }

    //Appre or Deny a Leave Request (ADMIN or MANAGER)
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<LeaveRequest> updateStatus(
            @PathVariable Long id,
            @RequestParam LeaveStatus status) {
        LeaveRequest updated = leaveRequestService.updateLeaveStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    // Delete leave request (ADMIN only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLeaveRequest(@PathVariable Long id) {
        leaveRequestService.deleteLeaveRequest(id);
        return ResponseEntity.noContent().build();
    }
}




