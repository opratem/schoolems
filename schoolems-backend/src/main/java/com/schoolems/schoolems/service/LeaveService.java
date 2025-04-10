package com.schoolems.schoolems.service;

import com.schoolems.schoolems.entity.Employee;
import com.schoolems.schoolems.entity.LeaveRequest;
import com.schoolems.schoolems.repository.LeaveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final EmployeeService employeeService;

    @Autowired
    public LeaveService(LeaveRepository leaveRepository, EmployeeService employeeService){
        this.leaveRepository= leaveRepository;
        this.employeeService = employeeService;
    }
    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRepository.findAll();
    }

    public LeaveRequest submitLeaveRequest (LeaveRequest leaveRequest, Long employeeId){
        Employee employee = employeeService.getEmployeeById(employeeId);
        leaveRequest.setEmployee(employee);
        return leaveRepository.save(leaveRequest);
    }
}
