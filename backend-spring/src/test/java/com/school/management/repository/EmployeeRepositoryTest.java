package com.school.management.repository;

import com.school.management.entity.Employee;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EmployeeRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EmployeeRepository employeeRepository;

    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        testEmployee = Employee.builder()
                .employeeId("EMP001")
                .name("John Doe")
                .email("john.doe@school.com")
                .contactInfo("1234567890")
                .department("IT")
                .position("Software Developer")
                .startDate(LocalDate.of(2023, 1, 15))
                .build();

        entityManager.persistAndFlush(testEmployee);
    }

    @Test
    void findByEmployeeId_WhenEmployeeExists_ShouldReturnEmployee() {
        // When
        Optional<Employee> result = employeeRepository.findByEmployeeId("EMP001");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getEmployeeId()).isEqualTo("EMP001");
        assertThat(result.get().getName()).isEqualTo("John Doe");
        assertThat(result.get().getEmail()).isEqualTo("john.doe@school.com");
        assertThat(result.get().getDepartment()).isEqualTo("IT");
        assertThat(result.get().getPosition()).isEqualTo("Software Developer");
    }

    @Test
    void findByEmployeeId_WhenEmployeeDoesNotExist_ShouldReturnEmpty() {
        // When
        Optional<Employee> result = employeeRepository.findByEmployeeId("EMP999");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByEmployeeId_WhenEmployeeIdIsNull_ShouldReturnEmpty() {
        // When
        Optional<Employee> result = employeeRepository.findByEmployeeId(null);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByEmployeeId_WhenEmployeeIdIsEmpty_ShouldReturnEmpty() {
        // When
        Optional<Employee> result = employeeRepository.findByEmployeeId("");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByEmployeeId_ShouldBeCaseExact() {
        // When
        Optional<Employee> result = employeeRepository.findByEmployeeId("emp001");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByEmployeeId_WithWhitespace_ShouldReturnEmpty() {
        // When
        Optional<Employee> result = employeeRepository.findByEmployeeId(" EMP001 ");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void employeeRepository_ShouldSaveAndRetrieveEmployeeWithAllFields() {
        // Given
        Employee newEmployee = Employee.builder()
                .employeeId("EMP002")
                .name("Jane Smith")
                .email("jane.smith@school.com")
                .phone("0987654321")
                .department("HR")
                .position("HR Manager")
                .hireDate(LocalDate.of(2022, 6, 1))
                .salary(85000.0)
                .build();

        // When
        Employee savedEmployee = employeeRepository.save(newEmployee);
        entityManager.flush();
        entityManager.clear(); // Clear persistence context to ensure fresh fetch

        Optional<Employee> retrievedEmployee = employeeRepository.findByEmployeeId("EMP002");

        // Then
        assertThat(savedEmployee.getId()).isNotNull();
        assertThat(retrievedEmployee).isPresent();
        assertThat(retrievedEmployee.get().getEmployeeId()).isEqualTo("EMP002");
        assertThat(retrievedEmployee.get().getFirstName()).isEqualTo("Jane");
        assertThat(retrievedEmployee.get().getLastName()).isEqualTo("Smith");
        assertThat(retrievedEmployee.get().getEmail()).isEqualTo("jane.smith@school.com");
        assertThat(retrievedEmployee.get().getPhone()).isEqualTo("0987654321");
        assertThat(retrievedEmployee.get().getDepartment()).isEqualTo("HR");
        assertThat(retrievedEmployee.get().getPosition()).isEqualTo("HR Manager");
        assertThat(retrievedEmployee.get().getHireDate()).isEqualTo(LocalDate.of(2022, 6, 1));
        assertThat(retrievedEmployee.get().getSalary()).isEqualTo(85000.0);
    }

    @Test
    void employeeRepository_ShouldHandleEmployeeWithMinimalFields() {
        // Given
        Employee minimalEmployee = Employee.builder()
                .employeeId("EMP003")
                .firstName("Bob")
                .lastName("Johnson")
                .email("bob.johnson@school.com")
                .department("Finance")
                .position("Accountant")
                .build();

        // When
        Employee savedEmployee = employeeRepository.save(minimalEmployee);
        Optional<Employee> retrievedEmployee = employeeRepository.findByEmployeeId("EMP003");

        // Then
        assertThat(savedEmployee.getId()).isNotNull();
        assertThat(retrievedEmployee).isPresent();
        assertThat(retrievedEmployee.get().getPhone()).isNull();
        assertThat(retrievedEmployee.get().getHireDate()).isNull();
        assertThat(retrievedEmployee.get().getSalary()).isNull();
    }

    @Test
    void employeeRepository_ShouldUpdateExistingEmployee() {
        // Given
        Optional<Employee> existingEmployee = employeeRepository.findByEmployeeId("EMP001");
        assertThat(existingEmployee).isPresent();

        Employee employee = existingEmployee.get();
        employee.setDepartment("Engineering");
        employee.setPosition("Senior Software Developer");
        employee.setSalary(85000.0);

        // When
        employeeRepository.save(employee);
        entityManager.flush();
        entityManager.clear();

        Optional<Employee> updatedEmployee = employeeRepository.findByEmployeeId("EMP001");

        // Then
        assertThat(updatedEmployee).isPresent();
        assertThat(updatedEmployee.get().getDepartment()).isEqualTo("Engineering");
        assertThat(updatedEmployee.get().getPosition()).isEqualTo("Senior Software Developer");
        assertThat(updatedEmployee.get().getSalary()).isEqualTo(85000.0);
        assertThat(updatedEmployee.get().getFirstName()).isEqualTo("John"); // Unchanged fields
        assertThat(updatedEmployee.get().getLastName()).isEqualTo("Doe");
    }

    @Test
    void employeeRepository_ShouldDeleteEmployee() {
        // Given
        assertThat(employeeRepository.findByEmployeeId("EMP001")).isPresent();

        // When
        employeeRepository.delete(testEmployee);
        entityManager.flush();

        // Then
        Optional<Employee> deletedEmployee = employeeRepository.findByEmployeeId("EMP001");
        assertThat(deletedEmployee).isEmpty();
    }

    @Test
    void employeeRepository_ShouldFindAllEmployees() {
        // Given
        Employee secondEmployee = Employee.builder()
                .employeeId("EMP004")
                .firstName("Alice")
                .lastName("Brown")
                .email("alice.brown@school.com")
                .department("Marketing")
                .position("Marketing Specialist")
                .build();
        entityManager.persistAndFlush(secondEmployee);

        // When
        var allEmployees = employeeRepository.findAll();

        // Then
        assertThat(allEmployees).hasSize(2);
        assertThat(allEmployees).extracting(Employee::getEmployeeId)
                .containsExactlyInAnyOrder("EMP001", "EMP004");
    }

    @Test
    void employeeRepository_ShouldHandleUniqueConstraintOnEmployeeId() {
        // Given
        Employee duplicateEmployee = Employee.builder()
                .employeeId("EMP001") // Same as existing employee
                .firstName("Different")
                .lastName("Person")
                .email("different@school.com")
                .department("Different")
                .position("Different Position")
                .build();

        // When & Then
        // This should throw an exception due to unique constraint
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> {
                    employeeRepository.save(duplicateEmployee);
                    entityManager.flush();
                }
        );
    }
}
