package com.school.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.management.entity.Employee;
import com.school.management.entity.LeaveRequest;
import com.school.management.entity.LeaveStatus;
import com.school.management.entity.LeaveType;
import com.school.management.service.EmployeeService;
import com.school.management.service.LeaveRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaveRequestController.class)
class LeaveRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LeaveRequestService leaveRequestService;

    @MockBean
    private EmployeeService employeeService;

    @Autowired
    private ObjectMapper objectMapper;

    private Employee testEmployee1;
    private Employee testEmployee2;
    private LeaveRequest testLeaveRequest1;
    private LeaveRequest testLeaveRequest2;
    private LeaveRequest testLeaveRequest3;
    private List<LeaveRequest> leaveRequestList;

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
                .leaveType(LeaveType.OTHER)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(12))
                .reason("Personal matters")
                .status(LeaveStatus.PENDING)
                .build();

        leaveRequestList = Arrays.asList(testLeaveRequest1, testLeaveRequest2, testLeaveRequest3);
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void createLeaveRequest_WithValidData_ReturnsCreatedLeaveRequest() throws Exception {
        // Arrange
        LeaveRequest newLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .reason("Personal leave")
                .build();

        LeaveRequest savedLeaveRequest = LeaveRequest.builder()
                .id(4L)
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .reason("Personal leave")
                .status(LeaveStatus.PENDING)
                .build();

        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(leaveRequestService.save(any(LeaveRequest.class))).thenReturn(savedLeaveRequest);

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLeaveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.leaveType").value("ANNUAL"))
                .andExpect(jsonPath("$.reason").value("Personal leave"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void createLeaveRequest_WithManagerRole_ReturnsCreatedLeaveRequest() throws Exception {
        // Arrange
        LeaveRequest newLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .reason("Personal leave")
                .build();

        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(leaveRequestService.save(any(LeaveRequest.class))).thenReturn(testLeaveRequest1);

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLeaveRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void createLeaveRequest_WithAdminRole_ReturnsCreatedLeaveRequest() throws Exception {
        // Arrange
        LeaveRequest newLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .reason("Personal leave")
                .build();

        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(leaveRequestService.save(any(LeaveRequest.class))).thenReturn(testLeaveRequest1);

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLeaveRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void createLeaveRequest_WithNullEmployee_ReturnsBadRequest() throws Exception {
        // Arrange
        LeaveRequest invalidLeaveRequest = LeaveRequest.builder()
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .reason("Personal leave")
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLeaveRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void createLeaveRequest_WithNonexistentEmployee_ReturnsBadRequest() throws Exception {
        // Arrange
        Employee nonexistentEmployee = Employee.builder().id(999L).build();
        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(nonexistentEmployee)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .reason("Personal leave")
                .build();

        when(employeeService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(leaveRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createLeaveRequest_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Arrange
        LeaveRequest newLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLeaveRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void createLeaveRequest_WithInvalidRole_ReturnsForbidden() throws Exception {
        // Arrange
        LeaveRequest newLeaveRequest = LeaveRequest.builder()
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/leaverequests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLeaveRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void getAllLeaveRequests_WithManagerRole_ReturnsLeaveRequestList() throws Exception {
        // Arrange
        when(leaveRequestService.findAll()).thenReturn(leaveRequestList);

        // Act & Assert
        mockMvc.perform(get("/api/leaverequests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].reason").value("Vacation"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].reason").value("Illness"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void getAllLeaveRequests_WithAdminRole_ReturnsLeaveRequestList() throws Exception {
        // Arrange
        when(leaveRequestService.findAll()).thenReturn(leaveRequestList);

        // Act & Assert
        mockMvc.perform(get("/api/leaverequests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void getAllLeaveRequests_WithEmployeeRole_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/leaverequests"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllLeaveRequests_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/leaverequests"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void getLeaveRequestsForEmployee_WithValidEmployeeId_ReturnsLeaveRequests() throws Exception {
        // Arrange
        List<LeaveRequest> employeeRequests = Arrays.asList(testLeaveRequest1, testLeaveRequest2);
        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(leaveRequestService.findByEmployee(testEmployee1)).thenReturn(employeeRequests);

        // Act & Assert
        mockMvc.perform(get("/api/leaverequests/employee/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].reason").value("Vacation"))
                .andExpect(jsonPath("$[1].reason").value("Illness"));
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void getLeaveRequestsForEmployee_WithManagerRole_ReturnsLeaveRequests() throws Exception {
        // Arrange
        List<LeaveRequest> employeeRequests = Arrays.asList(testLeaveRequest1);
        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(leaveRequestService.findByEmployee(testEmployee1)).thenReturn(employeeRequests);

        // Act & Assert
        mockMvc.perform(get("/api/leaverequests/employee/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void getLeaveRequestsForEmployee_WithAdminRole_ReturnsLeaveRequests() throws Exception {
        // Arrange
        List<LeaveRequest> employeeRequests = Arrays.asList(testLeaveRequest1);
        when(employeeService.findById(1L)).thenReturn(Optional.of(testEmployee1));
        when(leaveRequestService.findByEmployee(testEmployee1)).thenReturn(employeeRequests);

        // Act & Assert
        mockMvc.perform(get("/api/leaverequests/employee/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void getLeaveRequestsForEmployee_WithNonexistentEmployee_ReturnsNotFound() throws Exception {
        // Arrange
        when(employeeService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/leaverequests/employee/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void updateLeaveRequestStatus_WithValidRequest_ReturnsUpdatedRequest() throws Exception {
        // Arrange
        LeaveRequest updatedRequest = LeaveRequest.builder()
                .id(1L)
                .employee(testEmployee1)
                .leaveType(LeaveType.ANNUAL)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(5))
                .reason("Vacation")
                .status(LeaveStatus.APPROVED)
                .build();

        when(leaveRequestService.findById(1L)).thenReturn(Optional.of(testLeaveRequest1));
        when(leaveRequestService.save(any(LeaveRequest.class))).thenReturn(updatedRequest);

        // Act & Assert
        mockMvc.perform(put("/api/leaverequests/1/status")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void updateLeaveRequestStatus_WithAdminRole_ReturnsUpdatedRequest() throws Exception {
        // Arrange
        when(leaveRequestService.findById(1L)).thenReturn(Optional.of(testLeaveRequest1));
        when(leaveRequestService.save(any(LeaveRequest.class))).thenReturn(testLeaveRequest1);

        // Act & Assert
        mockMvc.perform(put("/api/leaverequests/1/status")
                        .param("status", "REJECTED"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void updateLeaveRequestStatus_WithNonexistentRequest_ReturnsNotFound() throws Exception {
        // Arrange
        when(leaveRequestService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(put("/api/leaverequests/999/status")
                        .param("status", "APPROVED"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void updateLeaveRequestStatus_WithEmployeeRole_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(put("/api/leaverequests/1/status")
                        .param("status", "APPROVED"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void deleteOwnPendingLeaveRequest_WithPendingRequest_ReturnsNoContent() throws Exception {
        // Arrange
        when(leaveRequestService.findById(1L)).thenReturn(Optional.of(testLeaveRequest1));
        doNothing().when(leaveRequestService).deleteById(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"MANAGER"})
    void deleteOwnPendingLeaveRequest_WithManagerRole_ReturnsNoContent() throws Exception {
        // Arrange
        when(leaveRequestService.findById(1L)).thenReturn(Optional.of(testLeaveRequest1));
        doNothing().when(leaveRequestService).deleteById(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void deleteOwnPendingLeaveRequest_WithAdminRole_ReturnsNoContent() throws Exception {
        // Arrange
        when(leaveRequestService.findById(1L)).thenReturn(Optional.of(testLeaveRequest1));
        doNothing().when(leaveRequestService).deleteById(1L);

        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void deleteOwnPendingLeaveRequest_WithApprovedRequest_ReturnsBadRequest() throws Exception {
        // Arrange
        when(leaveRequestService.findById(2L)).thenReturn(Optional.of(testLeaveRequest2)); // Approved status

        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/2"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"EMPLOYEE"})
    void deleteOwnPendingLeaveRequest_WithNonexistentRequest_ReturnsBadRequest() throws Exception {
        // Arrange
        when(leaveRequestService.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/999"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteOwnPendingLeaveRequest_WithoutAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void deleteOwnPendingLeaveRequest_WithInvalidRole_ReturnsForbidden() throws Exception {
        // Act & Assert
        mockMvc.perform(delete("/api/leaverequests/1"))
                .andExpect(status().isForbidden());
    }
}
