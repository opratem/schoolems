package com.school.management.service;

import com.school.management.entity.Employee;
import com.school.management.repository.EmployeeRepository;
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
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee testEmployee1;
    private Employee testEmployee2;

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
    }

    @Test
    void findAll_ReturnsAllEmployees() {
        // Arrange
        List<Employee> employees = Arrays.asList(testEmployee1, testEmployee2);
        when(employeeRepository.findAll()).thenReturn(employees);

        // Act
        List<Employee> result = employeeService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(employees, result);
        verify(employeeRepository).findAll();
    }

    @Test
    void findAll_WithNoEmployees_ReturnsEmptyList() {
        // Arrange
        when(employeeRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<Employee> result = employeeService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(employeeRepository).findAll();
    }

    @Test
    void findById_WithExistingEmployee_ReturnsEmployee() {
        // Arrange
        Long employeeId = 1L;
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee1));

        // Act
        Optional<Employee> result = employeeService.findById(employeeId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testEmployee1, result.get());
        verify(employeeRepository).findById(employeeId);
    }

    @Test
    void findById_WithNonexistentEmployee_ReturnsEmpty() {
        // Arrange
        Long employeeId = 999L;
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.empty());

        // Act
        Optional<Employee> result = employeeService.findById(employeeId);

        // Assert
        assertFalse(result.isPresent());
        verify(employeeRepository).findById(employeeId);
    }

    @Test
    void findByEmployeeId_WithExistingEmployeeId_ReturnsEmployee() {
        // Arrange
        String employeeId = "EMP001";
        when(employeeRepository.findByEmployeeId(employeeId)).thenReturn(Optional.of(testEmployee1));

        // Act
        Optional<Employee> result = employeeService.findByEmployeeId(employeeId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testEmployee1, result.get());
        verify(employeeRepository).findByEmployeeId(employeeId);
    }

    @Test
    void findByEmployeeId_WithNonexistentEmployeeId_ReturnsEmpty() {
        // Arrange
        String employeeId = "EMP999";
        when(employeeRepository.findByEmployeeId(employeeId)).thenReturn(Optional.empty());

        // Act
        Optional<Employee> result = employeeService.findByEmployeeId(employeeId);

        // Assert
        assertFalse(result.isPresent());
        verify(employeeRepository).findByEmployeeId(employeeId);
    }

    @Test
    void save_WithValidEmployee_ReturnsEmployee() {
        // Arrange
        when(employeeRepository.save(testEmployee1)).thenReturn(testEmployee1);

        // Act
        Employee result = employeeService.save(testEmployee1);

        // Assert
        assertEquals(testEmployee1, result);
        verify(employeeRepository).save(testEmployee1);
    }

    @Test
    void save_WithNewEmployee_ReturnsEmployee() {
        // Arrange
        Employee newEmployee = Employee.builder()
                .employeeId("EMP003")
                .name("Bob Wilson")
                .department("Finance")
                .position("Analyst")
                .contactInfo("bob.wilson@company.com")
                .startDate(LocalDate.now())
                .build();

        Employee savedEmployee = Employee.builder()
                .id(3L)
                .employeeId("EMP003")
                .name("Bob Wilson")
                .department("Finance")
                .position("Analyst")
                .contactInfo("bob.wilson@company.com")
                .startDate(LocalDate.now())
                .build();

        when(employeeRepository.save(newEmployee)).thenReturn(savedEmployee);

        // Act
        Employee result = employeeService.save(newEmployee);

        // Assert
        assertEquals(savedEmployee, result);
        assertNotNull(result.getId());
        verify(employeeRepository).save(newEmployee);
    }

    @Test
    void deleteById_WithExistingEmployee_CallsRepository() {
        // Arrange
        Long employeeId = 1L;

        // Act
        employeeService.deleteById(employeeId);

        // Assert
        verify(employeeRepository).deleteById(employeeId);
    }

    @Test
    void deleteById_WithNonexistentEmployee_CallsRepository() {
        // Arrange
        Long employeeId = 999L;

        // Act
        employeeService.deleteById(employeeId);

        // Assert
        verify(employeeRepository).deleteById(employeeId);
    }
}
