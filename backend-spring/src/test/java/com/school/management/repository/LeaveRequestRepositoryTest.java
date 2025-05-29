package com.school.management.repository;

import com.school.management.entity.Employee;
import com.school.management.entity.LeaveRequest;
import com.school.management.entity.LeaveStatus;
import com.school.management.entity.LeaveType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class LeaveRequestRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    private Employee employee1;
    private Employee employee2;
    private LeaveRequest pendingRequest;
    private LeaveRequest approvedRequest;
    private LeaveRequest rejectedRequest;

    @BeforeEach
    void setUp() {
        // Create test employees
        employee1 = Employee.builder()
                .employeeId("EMP001")
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@school.com")
                .phone("1234567890")
                .department("IT")
                .position("Developer")
                .build();
        entityManager.persistAndFlush(employee1);

        employee2 = Employee.builder()
                .employeeId("EMP002")
                .firstName("Jane")
                .lastName("Smith")
                .email("jane.smith@school.com")
                .phone("0987654321")
                .department("HR")
                .position("Manager")
                .build();
        entityManager.persistAndFlush(employee2);

        // Create test leave requests
        pendingRequest = LeaveRequest.builder()
                .employee(employee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.of(2024, 6, 1))
                .endDate(LocalDate.of(2024, 6, 5))
                .reason("Vacation")
                .status(LeaveStatus.PENDING)
                .build();
        entityManager.persistAndFlush(pendingRequest);

        approvedRequest = LeaveRequest.builder()
                .employee(employee1)
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 7, 2))
                .reason("Medical appointment")
                .status(LeaveStatus.APPROVED)
                .build();
        entityManager.persistAndFlush(approvedRequest);

        rejectedRequest = LeaveRequest.builder()
                .employee(employee2)
                .leaveType(LeaveType.PERSONAL)
                .startDate(LocalDate.of(2024, 8, 1))
                .endDate(LocalDate.of(2024, 8, 1))
                .reason("Personal matters")
                .status(LeaveStatus.REJECTED)
                .rejectionReason("Insufficient notice")
                .build();
        entityManager.persistAndFlush(rejectedRequest);
    }

    @Test
    void findByEmployee_WhenEmployeeHasRequests_ShouldReturnAllRequests() {
        // When
        List<LeaveRequest> result = leaveRequestRepository.findByEmployee(employee1);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).extracting(LeaveRequest::getStatus)
                .containsExactlyInAnyOrder(LeaveStatus.PENDING, LeaveStatus.APPROVED);
        assertThat(result).extracting(LeaveRequest::getLeaveType)
                .containsExactlyInAnyOrder(LeaveType.ANNUAL, LeaveType.SICK);
        assertThat(result).allSatisfy(request ->
                assertThat(request.getEmployee().getEmployeeId()).isEqualTo("EMP001"));
    }

    @Test
    void findByEmployee_WhenEmployeeHasSingleRequest_ShouldReturnSingleRequest() {
        // When
        List<LeaveRequest> result = leaveRequestRepository.findByEmployee(employee2);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(LeaveStatus.REJECTED);
        assertThat(result.get(0).getLeaveType()).isEqualTo(LeaveType.PERSONAL);
        assertThat(result.get(0).getRejectionReason()).isEqualTo("Insufficient notice");
    }

    @Test
    void findByEmployee_WhenEmployeeHasNoRequests_ShouldReturnEmptyList() {
        // Given
        Employee employeeWithoutRequests = Employee.builder()
                .employeeId("EMP003")
                .firstName("Bob")
                .lastName("Johnson")
                .email("bob.johnson@school.com")
                .department("Finance")
                .position("Accountant")
                .build();
        entityManager.persistAndFlush(employeeWithoutRequests);

        // When
        List<LeaveRequest> result = leaveRequestRepository.findByEmployee(employeeWithoutRequests);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByEmployee_WhenEmployeeIsNull_ShouldReturnEmptyList() {
        // When
        List<LeaveRequest> result = leaveRequestRepository.findByEmployee(null);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByStatus_WhenStatusHasRequests_ShouldReturnMatchingRequests() {
        // When
        List<LeaveRequest> pendingResults = leaveRequestRepository.findByStatus(LeaveStatus.PENDING);
        List<LeaveRequest> approvedResults = leaveRequestRepository.findByStatus(LeaveStatus.APPROVED);
        List<LeaveRequest> rejectedResults = leaveRequestRepository.findByStatus(LeaveStatus.REJECTED);

        // Then
        assertThat(pendingResults).hasSize(1);
        assertThat(pendingResults.get(0).getStatus()).isEqualTo(LeaveStatus.PENDING);
        assertThat(pendingResults.get(0).getEmployee().getEmployeeId()).isEqualTo("EMP001");

        assertThat(approvedResults).hasSize(1);
        assertThat(approvedResults.get(0).getStatus()).isEqualTo(LeaveStatus.APPROVED);
        assertThat(approvedResults.get(0).getEmployee().getEmployeeId()).isEqualTo("EMP001");

        assertThat(rejectedResults).hasSize(1);
        assertThat(rejectedResults.get(0).getStatus()).isEqualTo(LeaveStatus.REJECTED);
        assertThat(rejectedResults.get(0).getEmployee().getEmployeeId()).isEqualTo("EMP002");
    }

    @Test
    void findByStatus_WhenStatusHasNoRequests_ShouldReturnEmptyList() {
        // Create a status that has no requests (assuming CANCELLED exists)
        // When
        List<LeaveRequest> result = leaveRequestRepository.findByStatus(LeaveStatus.CANCELLED);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByStatus_WhenStatusIsNull_ShouldReturnEmptyList() {
        // When
        List<LeaveRequest> result = leaveRequestRepository.findByStatus(null);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void leaveRequestRepository_ShouldSaveAndRetrieveCompleteLeaveRequest() {
        // Given
        LeaveRequest newRequest = LeaveRequest.builder()
                .employee(employee2)
                .leaveType(LeaveType.MATERNITY)
                .startDate(LocalDate.of(2024, 9, 1))
                .endDate(LocalDate.of(2024, 12, 1))
                .reason("Maternity leave")
                .status(LeaveStatus.PENDING)
                .build();

        // When
        LeaveRequest savedRequest = leaveRequestRepository.save(newRequest);
        entityManager.flush();
        entityManager.clear(); // Clear persistence context to ensure fresh fetch

        List<LeaveRequest> employee2Requests = leaveRequestRepository.findByEmployee(employee2);

        // Then
        assertThat(savedRequest.getId()).isNotNull();
        assertThat(employee2Requests).hasSize(2); // Previous rejected + new pending

        LeaveRequest retrievedRequest = employee2Requests.stream()
                .filter(req -> req.getLeaveType() == LeaveType.MATERNITY)
                .findFirst()
                .orElse(null);

        assertThat(retrievedRequest).isNotNull();
        assertThat(retrievedRequest.getStartDate()).isEqualTo(LocalDate.of(2024, 9, 1));
        assertThat(retrievedRequest.getEndDate()).isEqualTo(LocalDate.of(2024, 12, 1));
        assertThat(retrievedRequest.getReason()).isEqualTo("Maternity leave");
        assertThat(retrievedRequest.getStatus()).isEqualTo(LeaveStatus.PENDING);
    }

    @Test
    void leaveRequestRepository_ShouldUpdateLeaveRequestStatus() {
        // Given
        List<LeaveRequest> pendingRequests = leaveRequestRepository.findByStatus(LeaveStatus.PENDING);
        assertThat(pendingRequests).hasSize(1);

        LeaveRequest requestToUpdate = pendingRequests.get(0);
        requestToUpdate.setStatus(LeaveStatus.APPROVED);
        requestToUpdate.setApprovalDate(LocalDate.now());

        // When
        leaveRequestRepository.save(requestToUpdate);
        entityManager.flush();
        entityManager.clear();

        List<LeaveRequest> updatedPendingRequests = leaveRequestRepository.findByStatus(LeaveStatus.PENDING);
        List<LeaveRequest> updatedApprovedRequests = leaveRequestRepository.findByStatus(LeaveStatus.APPROVED);

        // Then
        assertThat(updatedPendingRequests).isEmpty();
        assertThat(updatedApprovedRequests).hasSize(2); // Original approved + newly approved
    }

    @Test
    void leaveRequestRepository_ShouldDeleteLeaveRequest() {
        // Given
        List<LeaveRequest> initialRequests = leaveRequestRepository.findByEmployee(employee1);
        assertThat(initialRequests).hasSize(2);

        // When
        leaveRequestRepository.delete(pendingRequest);
        entityManager.flush();

        List<LeaveRequest> remainingRequests = leaveRequestRepository.findByEmployee(employee1);

        // Then
        assertThat(remainingRequests).hasSize(1);
        assertThat(remainingRequests.get(0).getStatus()).isEqualTo(LeaveStatus.APPROVED);
    }

    @Test
    void leaveRequestRepository_ShouldHandleMultipleRequestsForSameEmployeeAndStatus() {
        // Given
        LeaveRequest anotherPendingRequest = LeaveRequest.builder()
                .employee(employee1)
                .leaveType(LeaveType.EMERGENCY)
                .startDate(LocalDate.of(2024, 10, 15))
                .endDate(LocalDate.of(2024, 10, 15))
                .reason("Family emergency")
                .status(LeaveStatus.PENDING)
                .build();
        entityManager.persistAndFlush(anotherPendingRequest);

        // When
        List<LeaveRequest> employee1Requests = leaveRequestRepository.findByEmployee(employee1);
        List<LeaveRequest> pendingRequests = leaveRequestRepository.findByStatus(LeaveStatus.PENDING);

        // Then
        assertThat(employee1Requests).hasSize(3); // Original 2 + new pending
        assertThat(pendingRequests).hasSize(2); // Original pending + new pending
        assertThat(pendingRequests).extracting(LeaveRequest::getLeaveType)
                .containsExactlyInAnyOrder(LeaveType.ANNUAL, LeaveType.EMERGENCY);
    }

    @Test
    void leaveRequestRepository_ShouldPreserveDateRangesCorrectly() {
        // Given
        LeaveRequest longTermRequest = LeaveRequest.builder()
                .employee(employee2)
                .leaveType(LeaveType.SABBATICAL)
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 12, 31))
                .reason("Sabbatical year")
                .status(LeaveStatus.APPROVED)
                .build();

        // When
        LeaveRequest savedRequest = leaveRequestRepository.save(longTermRequest);
        entityManager.flush();
        entityManager.clear();

        List<LeaveRequest> employee2Requests = leaveRequestRepository.findByEmployee(employee2);

        // Then
        LeaveRequest retrievedLongTermRequest = employee2Requests.stream()
                .filter(req -> req.getLeaveType() == LeaveType.SABBATICAL)
                .findFirst()
                .orElse(null);

        assertThat(retrievedLongTermRequest).isNotNull();
        assertThat(retrievedLongTermRequest.getStartDate()).isEqualTo(LocalDate.of(2024, 1, 1));
        assertThat(retrievedLongTermRequest.getEndDate()).isEqualTo(LocalDate.of(2024, 12, 31));
    }
}
