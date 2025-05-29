package com.school.management.service;

import com.school.management.entity.Employee;
import com.school.management.entity.LeaveRequest;
import com.school.management.entity.LeaveStatus;
import com.school.management.entity.LeaveType;
import com.school.management.repository.LeaveRequestRepositoryTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

    @Mock
    private LeaveRequestRepositoryTest leaveRequestRepository;

    @InjectMocks
    private LeaveRequestService leaveRequestService;

    private Employee testEmployee1;
    private Employee testEmployee2;
    private LeaveRequest testLeaveRequest1;
    private LeaveRequest testLeaveRequest2;
    private LeaveRequest testLeaveRequest3;

    @BeforeEach
    void setUp() {
        testEmployee1 = Employee.builder()
                .id(1L)
                .employeeId("EMP001")
                .name("John Doe")
                .department("IT")
                .position("Developer")
                .contactInfo("john.doe@company.com")
                .startDate(LocalDate.now())
                .build();

        testEmployee2 = Employee.builder()
                .id(2L)
                .employeeId("EMP002")
                .name("Jane Smith")
                .department("HR")
                .position("Manager")
                .contactInfo("jane.smith@company.com")
                .startDate(LocalDate.now().minusYears(1))
                .build();

        testLeaveRequest1 = LeaveRequest.builder()
                .id(1L)
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(5))
                .reason("Vacation")
                .status(LeaveStatus.PENDING)
                .build();

        testLeaveRequest2 = LeaveRequest.builder()
                .id(2L)
                .employee(testEmployee1)
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.now().minusDays(3))
                .endDate(LocalDate.now().minusDays(1))
                .reason("Illness")
                .status(LeaveStatus.APPROVED)
                .build();

        testLeaveRequest3 = LeaveRequest.builder()
                .id(3L)
                .employee(testEmployee2)
                .leaveType(LeaveType.PERSONAL)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(12))
                .reason("Personal matters")
                .status(LeaveStatus.PENDING)
                .build();
    }

    @Test
    void findAll_ReturnsAllLeaveRequests() {
        // Arrange
        List<LeaveRequest> leaveRequests = Arrays.asList(testLeaveRequest1, testLeaveRequest2, testLeaveRequest3);
        when(leaveRequestRepository.findAll()).thenReturn(leaveRequests);

        // Act
        List<LeaveRequest> result = leaveRequestService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(leaveRequests, result);
        verify(leaveRequestRepository).findAll();
    }

    @Test
    void findAll_WithNoLeaveRequests_ReturnsEmptyList() {
        // Arrange
        when(leaveRequestRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<LeaveRequest> result = leaveRequestService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(leaveRequestRepository).findAll();
    }

    @Test
    void findById_WithExistingLeaveRequest_ReturnsLeaveRequest() {
        // Arrange
        Long leaveRequestId = 1L;
        when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.of(testLeaveRequest1));

        // Act
        Optional<LeaveRequest> result = leaveRequestService.findById(leaveRequestId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testLeaveRequest1, result.get());
        verify(leaveRequestRepository).findById(leaveRequestId);
    }

    @Test
    void findById_WithNonexistentLeaveRequest_ReturnsEmpty() {
        // Arrange
        Long leaveRequestId = 999L;
        when(leaveRequestRepository.findById(leaveRequestId)).thenReturn(Optional.empty());

        // Act
        Optional<LeaveRequest> result = leaveRequestService.findById(leaveRequestId);

        // Assert
        assertFalse(result.isPresent());
        verify(leaveRequestRepository).findById(leaveRequestId);
    }

    @Test
    void findByEmployee_WithExistingEmployee_ReturnsEmployeeLeaveRequests() {
        // Arrange
        List<LeaveRequest> employeeLeaveRequests = Arrays.asList(testLeaveRequest1, testLeaveRequest2);
        when(leaveRequestRepository.findByEmployee(testEmployee1)).thenReturn(employeeLeaveRequests);

        // Act
        List<LeaveRequest> result = leaveRequestService.findByEmployee(testEmployee1);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(employeeLeaveRequests, result);
        verify(leaveRequestRepository).findByEmployee(testEmployee1);
    }

    @Test
    void findByEmployee_WithEmployeeWithNoRequests_ReturnsEmptyList() {
        // Arrange
        Employee employeeWithNoRequests = Employee.builder()
                .id(3L)
                .employeeId("EMP003")
                .name("Bob Wilson")
                .build();

        when(leaveRequestRepository.findByEmployee(employeeWithNoRequests)).thenReturn(Arrays.asList());

        // Act
        List<LeaveRequest> result = leaveRequestService.findByEmployee(employeeWithNoRequests);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(leaveRequestRepository).findByEmployee(employeeWithNoRequests);
    }

    @Test
    void findByStatus_WithPendingStatus_ReturnsPendingRequests() {
        // Arrange
        List<LeaveRequest> pendingRequests = Arrays.asList(testLeaveRequest1, testLeaveRequest3);
        when(leaveRequestRepository.findByStatus(LeaveStatus.PENDING)).thenReturn(pendingRequests);

        // Act
        List<LeaveRequest> result = leaveRequestService.findByStatus(LeaveStatus.PENDING);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(pendingRequests, result);
        verify(leaveRequestRepository).findByStatus(LeaveStatus.PENDING);
    }

    @Test
    void findByStatus_WithApprovedStatus_ReturnsApprovedRequests() {
        // Arrange
        List<LeaveRequest> approvedRequests = Arrays.asList(testLeaveRequest2);
        when(leaveRequestRepository.findByStatus(LeaveStatus.APPROVED)).thenReturn(approvedRequests);

        // Act
        List<LeaveRequest> result = leaveRequestService.findByStatus(LeaveStatus.APPROVED);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(approvedRequests, result);
        verify(leaveRequestRepository).findByStatus(LeaveStatus.APPROVED);
    }

    @Test
    void findByStatus_WithRejectedStatus_ReturnsEmptyList() {
        // Arrange
        when(leaveRequestRepository.findByStatus(LeaveStatus.REJECTED)).thenReturn(Arrays.asList());

        // Act
        List<LeaveRequest> result = leaveRequestService.findByStatus(LeaveStatus.REJECTED);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(leaveRequestRepository).findByStatus(LeaveStatus.REJECTED);
    }

    @Test
    void save_WithValidLeaveRequest_ReturnsLeaveRequest() {
        // Arrange
        when(leaveRequestRepository.save(testLeaveRequest1)).thenReturn(testLeaveRequest1);

        // Act
        LeaveRequest result = leaveRequestService.save(testLeaveRequest1);

        // Assert
        assertEquals(testLeaveRequest1, result);
        verify(leaveRequestRepository).save(testLeaveRequest1);
    }

    @Test
    void save_WithNewLeaveRequest_ReturnsLeaveRequest() {
        // Arrange
        LeaveRequest newLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee2)
                .leaveType(LeaveType.EMERGENCY)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .reason("Emergency")
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest savedLeaveRequest = LeaveRequest.builder()
                .id(4L)
                .employee(testEmployee2)
                .leaveType(LeaveType.EMERGENCY)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .reason("Emergency")
                .status(LeaveStatus.PENDING)
                .build();

        when(leaveRequestRepository.save(newLeaveRequest)).thenReturn(savedLeaveRequest);

        // Act
        LeaveRequest result = leaveRequestService.save(newLeaveRequest);

        // Assert
        assertEquals(savedLeaveRequest, result);
        assertNotNull(result.getId());
        verify(leaveRequestRepository).save(newLeaveRequest);
    }

    @Test
    void save_WithUpdatedLeaveRequest_ReturnsUpdatedLeaveRequest() {
        // Arrange
        testLeaveRequest1.setStatus(LeaveStatus.APPROVED);
        when(leaveRequestRepository.save(testLeaveRequest1)).thenReturn(testLeaveRequest1);

        // Act
        LeaveRequest result = leaveRequestService.save(testLeaveRequest1);

        // Assert
        assertEquals(testLeaveRequest1, result);
        assertEquals(LeaveStatus.APPROVED, result.getStatus());
        verify(leaveRequestRepository).save(testLeaveRequest1);
    }

    @Test
    void deleteById_WithExistingLeaveRequest_CallsRepository() {
        // Arrange
        Long leaveRequestId = 1L;

        // Act
        leaveRequestService.deleteById(leaveRequestId);

        // Assert
        verify(leaveRequestRepository).deleteById(leaveRequestId);
    }

    @Test
    void deleteById_WithNonexistentLeaveRequest_CallsRepository() {
        // Arrange
        Long leaveRequestId = 999L;

        // Act
        leaveRequestService.deleteById(leaveRequestId);

        // Assert
        verify(leaveRequestRepository).deleteById(leaveRequestId);
    }
}
