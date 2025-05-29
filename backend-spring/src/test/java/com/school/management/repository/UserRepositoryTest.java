package com.school.management.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.*;
import com.school.management.repository.*;
import com.school.management.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class LeaveRequestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LeaveRequestRepositoryTest leaveRequestRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private String adminToken;
    private String employeeToken;
    private String managerToken;
    private Employee testEmployee;
    private Employee managerEmployee;
    private LeaveRequest testLeaveRequest;
    private Role adminRole;
    private Role employeeRole;
    private Role managerRole;

    @BeforeEach
    void setUp() {
        // Clean up existing data
        leaveRequestRepository.deleteAll();
        userRepository.deleteAll();
        employeeRepository.deleteAll();
        roleRepository.deleteAll();

        // Create roles
        adminRole = Role.builder().name("ADMIN").build();
        employeeRole = Role.builder().name("EMPLOYEE").build();
        managerRole = Role.builder().name("MANAGER").build();
        roleRepository.save(adminRole);
        roleRepository.save(employeeRole);
        roleRepository.save(managerRole);

        // Create test employees
        testEmployee = Employee.builder()
                .employeeId("EMP001")
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@school.com")
                .department("IT")
                .position("Developer")
                .build();
        employeeRepository.save(testEmployee);

        managerEmployee = Employee.builder()
                .employeeId("MGR001")
                .firstName("Jane")
                .lastName("Manager")
                .email("jane.manager@school.com")
                .department("IT")
                .position("Manager")
                .build();
        employeeRepository.save(managerEmployee);

        // Create test leave request
        testLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.of(2024, 6, 1))
                .endDate(LocalDate.of(2024, 6, 5))
                .reason("Vacation")
                .status(LeaveStatus.PENDING)
                .build();
        leaveRequestRepository.save(testLeaveRequest);

        // Create users and tokens
        User adminUser = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .roles(Set.of(adminRole))
                .build();
        userRepository.save(adminUser);
        adminToken = jwtUtils.generateTokenFromUsername("admin");

        User empUser = User.builder()
                .username("employee")
                .password(passwordEncoder.encode("emp123"))
                .employee(testEmployee)
                .roles(Set.of(employeeRole))
                .build();
        userRepository.save(empUser);
        employeeToken = jwtUtils.generateTokenFromUsername("employee");

        User mgrUser = User.builder()
                .username("manager")
                .password(passwordEncoder.encode("mgr123"))
                .employee(managerEmployee)
                .roles(Set.of(managerRole))
                .build();
        userRepository.save(mgrUser);
        managerToken = jwtUtils.generateTokenFromUsername("manager");
    }

    @Test
    void getAllLeaveRequests_WithAdminAuth_ShouldReturnAllRequests() throws Exception {
        // Given - Additional leave request
        LeaveRequest secondRequest = LeaveRequest.builder()
                .employee(managerEmployee)
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 7, 2))
                .reason("Medical appointment")
                .status(LeaveStatus.APPROVED)
                .build();
        leaveRequestRepository.save(secondRequest);

        // When & Then
        mockMvc.perform(get("/api/leave-requests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].leaveType", containsInAnyOrder("ANNUAL", "SICK")))
                .andExpect(jsonPath("$[*].status", containsInAnyOrder("PENDING", "APPROVED")));
    }

    @Test
    void getLeaveRequestById_WithValidId_ShouldReturnRequest() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/leave-requests/{id}", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.leaveType", is("ANNUAL")))
                .andExpect(jsonPath("$.startDate", is("2024-06-01")))
                .andExpect(jsonPath("$.endDate", is("2024-06-05")))
                .andExpect(jsonPath("$.reason", is("Vacation")))
                .andExpect(jsonPath("$.status", is("PENDING")));
    }

    @Test
    void createLeaveRequest_WithValidData_ShouldCreateRequest() throws Exception {
        // Given
        LeaveRequest newRequest = LeaveRequest.builder()
                .employee(testEmployee)
                .leaveType(LeaveType.PERSONAL)
                .startDate(LocalDate.of(2024, 8, 1))
                .endDate(LocalDate.of(2024, 8, 2))
                .reason("Personal matters")
                .status(LeaveStatus.PENDING)
                .build();

        // When & Then
        mockMvc.perform(post("/api/leave-requests")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.leaveType", is("PERSONAL")))
                .andExpect(jsonPath("$.startDate", is("2024-08-01")))
                .andExpect(jsonPath("$.endDate", is("2024-08-02")))
                .andExpect(jsonPath("$.reason", is("Personal matters")))
                .andExpect(jsonPath("$.status", is("PENDING")));

        // Verify request was created in database
        var requests = leaveRequestRepository.findByEmployee(testEmployee);
        assert requests.size() == 2; // Original + new request
    }

    @Test
    void createLeaveRequest_WithInvalidDateRange_ShouldReturnBadRequest() throws Exception {
        // Given - End date before start date
        LeaveRequest invalidRequest = LeaveRequest.builder()
                .employee(testEmployee)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.of(2024, 8, 5))
                .endDate(LocalDate.of(2024, 8, 1)) // End before start
                .reason("Invalid dates")
                .status(LeaveStatus.PENDING)
                .build();

        // When & Then
        mockMvc.perform(post("/api/leave-requests")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void approveLeaveRequest_WithManagerAuth_ShouldApproveRequest() throws Exception {
        // When & Then
        mockMvc.perform(put("/api/leave-requests/{id}/approve", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.approvalDate", notNullValue()));

        // Verify status was updated in database
        LeaveRequest updatedRequest = leaveRequestRepository.findById(testLeaveRequest.getId()).orElse(null);
        assert updatedRequest != null;
        assert updatedRequest.getStatus() == LeaveStatus.APPROVED;
        assert updatedRequest.getApprovalDate() != null;
    }

    @Test
    void rejectLeaveRequest_WithManagerAuth_ShouldRejectRequest() throws Exception {
        // Given
        String rejectionReason = "Insufficient notice";

        // When & Then
        mockMvc.perform(put("/api/leave-requests/{id}/reject", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\": \"" + rejectionReason + "\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", is(rejectionReason)));

        // Verify status was updated in database
        LeaveRequest updatedRequest = leaveRequestRepository.findById(testLeaveRequest.getId()).orElse(null);
        assert updatedRequest != null;
        assert updatedRequest.getStatus() == LeaveStatus.REJECTED;
        assert updatedRequest.getRejectionReason().equals(rejectionReason);
    }

    @Test
    void approveLeaveRequest_WithEmployeeAuth_ShouldReturnForbidden() throws Exception {
        // When & Then
        mockMvc.perform(put("/api/leave-requests/{id}/approve", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMyLeaveRequests_WithEmployeeAuth_ShouldReturnOnlyMyRequests() throws Exception {
        // Given - Create request for another employee
        Employee anotherEmployee = Employee.builder()
                .employeeId("EMP002")
                .firstName("Alice")
                .lastName("Smith")
                .email("alice@school.com")
                .department("HR")
                .position("Analyst")
                .build();
        employeeRepository.save(anotherEmployee);

        LeaveRequest anotherRequest = LeaveRequest.builder()
                .employee(anotherEmployee)
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 7, 1))
                .reason("Sick day")
                .status(LeaveStatus.PENDING)
                .build();
        leaveRequestRepository.save(anotherRequest);

        // When & Then
        mockMvc.perform(get("/api/leave-requests/my-requests")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1))) // Only own request
                .andExpect(jsonPath("$[0].employee.employeeId", is("EMP001")));
    }

    @Test
    void updateLeaveRequest_AsOwner_ShouldUpdateRequest() throws Exception {
        // Given
        LeaveRequest updatedRequest = LeaveRequest.builder()
                .id(testLeaveRequest.getId())
                .employee(testEmployee)
                .leaveType(LeaveType.EMERGENCY) // Changed type
                .startDate(LocalDate.of(2024, 6, 2)) // Changed start date
                .endDate(LocalDate.of(2024, 6, 4)) // Changed end date
                .reason("Family emergency") // Changed reason
                .status(LeaveStatus.PENDING)
                .build();

        // When & Then
        mockMvc.perform(put("/api/leave-requests/{id}", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.leaveType", is("EMERGENCY")))
                .andExpect(jsonPath("$.startDate", is("2024-06-02")))
                .andExpect(jsonPath("$.endDate", is("2024-06-04")))
                .andExpect(jsonPath("$.reason", is("Family emergency")));
    }

    @Test
    void deleteLeaveRequest_AsOwner_ShouldDeleteRequest() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/leave-requests/{id}", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isNoContent());

        // Verify request was deleted from database
        assert leaveRequestRepository.findById(testLeaveRequest.getId()).isEmpty();
    }

    @Test
    void deleteLeaveRequest_AsNonOwner_ShouldReturnForbidden() throws Exception {
        // Create another employee user
        Employee anotherEmployee = Employee.builder()
                .employeeId("EMP002")
                .firstName("Alice")
                .lastName("Smith")
                .email("alice@school.com")
                .department("HR")
                .position("Analyst")
                .build();
        employeeRepository.save(anotherEmployee);

        User anotherUser = User.builder()
                .username("alice")
                .password(passwordEncoder.encode("alice123"))
                .employee(anotherEmployee)
                .roles(Set.of(employeeRole))
                .build();
        userRepository.save(anotherUser);
        String aliceToken = jwtUtils.generateTokenFromUsername("alice");

        // When & Then
        mockMvc.perform(delete("/api/leave-requests/{id}", testLeaveRequest.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getLeaveRequestsByStatus_WithAdminAuth_ShouldReturnFilteredRequests() throws Exception {
        // Given - Additional requests with different statuses
        LeaveRequest approvedRequest = LeaveRequest.builder()
                .employee(testEmployee)
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2024, 7, 1))
                .endDate(LocalDate.of(2024, 7, 2))
                .reason("Medical")
                .status(LeaveStatus.APPROVED)
                .build();
        leaveRequestRepository.save(approvedRequest);

        // When & Then - Get pending requests
        mockMvc.perform(get("/api/leave-requests")
                        .param("status", "PENDING")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status", is("PENDING")));

        // When & Then - Get approved requests
        mockMvc.perform(get("/api/leave-requests")
                        .param("status", "APPROVED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status", is("APPROVED")));
    }

    @Test
    void leaveRequestFlow_CompleteWorkflow_ShouldWork() throws Exception {
        // Step 1: Employee creates leave request
        LeaveRequest newRequest = LeaveRequest.builder()
                .employee(testEmployee)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.of(2024, 9, 1))
                .endDate(LocalDate.of(2024, 12, 1))
                .reason("Annual leave")
                .status(LeaveStatus.PENDING)
                .build();

        String response = mockMvc.perform(post("/api/leave-requests")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newRequest)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        LeaveRequest createdRequest = objectMapper.readValue(response, LeaveRequest.class);
        Long requestId = createdRequest.getId();

        // Step 2: Manager reviews and approves
        mockMvc.perform(put("/api/leave-requests/{id}/approve", requestId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        // Step 3: Verify final state
        mockMvc.perform(get("/api/leave-requests/{id}", requestId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.approvalDate", notNullValue()));
    }

    @Test
    void leaveRequestOperations_WithoutAuth_ShouldReturnUnauthorized() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/leave-requests"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/leave-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/leave-requests/{id}/approve", testLeaveRequest.getId()))
                .andExpect(status().isUnauthorized());
    }
}
