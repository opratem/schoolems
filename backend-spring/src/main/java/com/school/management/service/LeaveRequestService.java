package com.school.management.service;

import com.school.management.entity.Employee;
import com.school.management.entity.LeaveRequest;
import com.school.management.entity.LeaveStatus;
import com.school.management.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;

    public List<LeaveRequest> findAll() {
        return leaveRequestRepository.findAll();
    }

    public Optional<LeaveRequest> findById(Long id) {
        return leaveRequestRepository.findById(id);
    }

    public List<LeaveRequest> findByEmployee(Employee employee) {
        return leaveRequestRepository.findByEmployee(employee);
    }

    public List<LeaveRequest> findByStatus(LeaveStatus status) {
        return leaveRequestRepository.findByStatus(status);
    }

    public LeaveRequest save(LeaveRequest leaveRequest) {
        return leaveRequestRepository.save(leaveRequest);
    }

    public void deleteById(Long id) {
        leaveRequestRepository.deleteById(id);
    }
}