package com.schoolems.schoolems.service;

import com.schoolems.schoolems.dto.LeaveRequestDTO;
import com.schoolems.schoolems.entity.Employee;
import com.schoolems.schoolems.entity.LeaveRequest;
import com.schoolems.schoolems.entity.LeaveRequest.LeaveStatus;
import com.schoolems.schoolems.repository.EmployeeRepository;
import com.schoolems.schoolems.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;

    //View all leave requests (ADMIN, MANAGER)
    public List<LeaveRequest> getAllLeaveRequests() {

        return leaveRequestRepository.findAll();
    }

    //View current employee's leave requests
    public List<LeaveRequest> getLeaveRequestsforEmployee(String email) {
        return leaveRequestRepository.findByEmployeeEmail(email);
    }

    //Employee submits a Leave Request
    public LeaveRequest submitLeaveRequest (LeaveRequestDTO dto, Authentication authentication){
        String email = authentication.getName();
        Employee employee = employeeRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Employee not Found"));


        LeaveRequest request = LeaveRequest.builder()
                .employee(employee)
                .type(dto.getType())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        return leaveRequestRepository.save(request);
    }

    //Admin or Manager approves/denies a request
    public LeaveRequest updateLeaveStatus(Long id, LeaveStatus status) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("leave request not found"));

        request.setStatus(status);
        return leaveRequestRepository.save(request);
    }
   public void deleteLeaveRequest(Long id){
        leaveRequestRepository.deleteById(id);
    }

}
