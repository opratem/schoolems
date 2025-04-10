package com.schoolems.schoolems.controller;

import com.schoolems.schoolems.entity.LeaveRequest;
import com.schoolems.schoolems.service.LeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/leave")
public class LeaveController {
    @Autowired
    private LeaveService leaveService;

    @GetMapping
    public List<LeaveRequest> getAllLeaveRequests(){
        return leaveService.getAllLeaveRequests();
    }

    @PostMapping
    public LeaveRequest submitLeaveRequest(
            @RequestBody LeaveRequest leaveRequest,
            @RequestParam Long employeeId){
        return leaveService.submitLeaveRequest(leaveRequest, employeeId);
    }
}
