package com.school.management.repository;

import com.school.management.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class RoleRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RoleRepository roleRepository;

    private Role employeeRole;
    private Role adminRole;
    private Role managerRole;

    @BeforeEach
    void setUp() {
        // Create test roles
        employeeRole = Role.builder()
                .name("EMPLOYEE")
                .build();
        entityManager.persistAndFlush(employeeRole);

        adminRole = Role.builder()
                .name("ADMIN")
                .build();
        entityManager.persistAndFlush(adminRole);

        managerRole = Role.builder()
                .name("MANAGER")
                .build();
        entityManager.persistAndFlush(managerRole);
    }

    @Test
    void findByName_WhenRoleExists_ShouldReturnRole() {
        // When
        Optional<Role> result = roleRepository.findByName("EMPLOYEE");

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("EMPLOYEE");
        assertThat(result.get().getId()).isNotNull();
    }

    @Test
    void findByName_WhenRoleDoesNotExist_ShouldReturnEmpty() {
        // When
        Optional<Role> result = roleRepository.findByName("NONEXISTENT");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByName_WhenNameIsNull_ShouldReturnEmpty() {
        // When
        Optional<Role> result = roleRepository.findByName(null);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByName_WhenNameIsEmpty_ShouldReturnEmpty() {
        // When
        Optional<Role> result = roleRepository.findByName("");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByName_ShouldBeCaseExact() {
        // When
        Optional<Role> result = roleRepository.findByName("employee");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByName_WithWhitespace_ShouldReturnEmpty() {
        // When
        Optional<Role> result = roleRepository.findByName(" EMPLOYEE ");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void findByName_ShouldReturnCorrectRoleForEachName() {
        // When
        Optional<Role> employeeResult = roleRepository.findByName("EMPLOYEE");
        Optional<Role> adminResult = roleRepository.findByName("ADMIN");
        Optional<Role> managerResult = roleRepository.findByName("MANAGER");

        // Then
        assertThat(employeeResult).isPresent();
        assertThat(employeeResult.get().getName()).isEqualTo("EMPLOYEE");

        assertThat(adminResult).isPresent();
        assertThat(adminResult.get().getName()).isEqualTo("ADMIN");

        assertThat(managerResult).isPresent();
        assertThat(managerResult.get().getName()).isEqualTo("MANAGER");

        // Verify they have different IDs
        assertThat(employeeResult.get().getId()).isNotEqualTo(adminResult.get().getId());
        assertThat(adminResult.get().getId()).isNotEqualTo(managerResult.get().getId());
        assertThat(employeeResult.get().getId()).isNotEqualTo(managerResult.get().getId());
    }

    @Test
    void roleRepository_ShouldSaveAndRetrieveNewRole() {
        // Given
        Role newRole = Role.builder()
                .name("SUPERVISOR")
                .build();

        // When
        Role savedRole = roleRepository.save(newRole);
        entityManager.flush();
        entityManager.clear(); // Clear persistence context to ensure fresh fetch

        Optional<Role> retrievedRole = roleRepository.findByName("SUPERVISOR");

        // Then
        assertThat(savedRole.getId()).isNotNull();
        assertThat(retrievedRole).isPresent();
        assertThat(retrievedRole.get().getName()).isEqualTo("SUPERVISOR");
        assertThat(retrievedRole.get().getId()).isEqualTo(savedRole.getId());
    }

    @Test
    void roleRepository_ShouldUpdateExistingRole() {
        // Given
        Optional<Role> existingRole = roleRepository.findByName("EMPLOYEE");
        assertThat(existingRole).isPresent();

        Role role = existingRole.get();
        role.setName("STAFF");

        // When
        roleRepository.save(role);
        entityManager.flush();
        entityManager.clear();

        Optional<Role> oldNameResult = roleRepository.findByName("EMPLOYEE");
        Optional<Role> newNameResult = roleRepository.findByName("STAFF");

        // Then
        assertThat(oldNameResult).isEmpty();
        assertThat(newNameResult).isPresent();
        assertThat(newNameResult.get().getId()).isEqualTo(role.getId());
    }

    @Test
    void roleRepository_ShouldDeleteRole() {
        // Given
        assertThat(roleRepository.findByName("MANAGER")).isPresent();

        // When
        roleRepository.delete(managerRole);
        entityManager.flush();

        // Then
        Optional<Role> deletedRole = roleRepository.findByName("MANAGER");
        assertThat(deletedRole).isEmpty();
    }

    @Test
    void roleRepository_ShouldFindAllRoles() {
        // When
        var allRoles = roleRepository.findAll();

        // Then
        assertThat(allRoles).hasSize(3);
        assertThat(allRoles).extracting(Role::getName)
                .containsExactlyInAnyOrder("EMPLOYEE", "ADMIN", "MANAGER");
    }

    @Test
    void roleRepository_ShouldHandleUniqueConstraintOnName() {
        // Given
        Role duplicateRole = Role.builder()
                .name("EMPLOYEE") // Same name as existing role
                .build();

        // When & Then
        // This should throw an exception due to unique constraint
        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> {
                    roleRepository.save(duplicateRole);
                    entityManager.flush();
                }
        );
    }

    @Test
    void roleRepository_ShouldHandleRoleWithSpecialCharacters() {
        // Given
        Role specialRole = Role.builder()
                .name("HR_SPECIALIST")
                .build();

        // When
        Role savedRole = roleRepository.save(specialRole);
        Optional<Role> retrievedRole = roleRepository.findByName("HR_SPECIALIST");

        // Then
        assertThat(savedRole.getId()).isNotNull();
        assertThat(retrievedRole).isPresent();
        assertThat(retrievedRole.get().getName()).isEqualTo("HR_SPECIALIST");
    }

    @Test
    void roleRepository_ShouldHandleRoleWithNumbers() {
        // Given
        Role numberedRole = Role.builder()
                .name("LEVEL1_ADMIN")
                .build();

        // When
        Role savedRole = roleRepository.save(numberedRole);
        Optional<Role> retrievedRole = roleRepository.findByName("LEVEL1_ADMIN");

        // Then
        assertThat(savedRole.getId()).isNotNull();
        assertThat(retrievedRole).isPresent();
        assertThat(retrievedRole.get().getName()).isEqualTo("LEVEL1_ADMIN");
    }

    @Test
    void roleRepository_ShouldHandleLongRoleName() {
        // Given
        String longRoleName = "VERY_LONG_ROLE_NAME_THAT_MIGHT_TEST_DATABASE_CONSTRAINTS";
        Role longNameRole = Role.builder()
                .name(longRoleName)
                .build();

        // When
        Role savedRole = roleRepository.save(longNameRole);
        Optional<Role> retrievedRole = roleRepository.findByName(longRoleName);

        // Then
        assertThat(savedRole.getId()).isNotNull();
        assertThat(retrievedRole).isPresent();
        assertThat(retrievedRole.get().getName()).isEqualTo(longRoleName);
    }

    @Test
    void roleRepository_ShouldMaintainDataIntegrityAcrossOperations() {
        // Given
        int initialCount = roleRepository.findAll().size();

        // When - Add a role
        Role newRole = roleRepository.save(Role.builder().name("TEMP_ROLE").build());
        entityManager.flush();

        // Then - Verify addition
        assertThat(roleRepository.findAll()).hasSize(initialCount + 1);
        assertThat(roleRepository.findByName("TEMP_ROLE")).isPresent();

        // When - Delete the role
        roleRepository.delete(newRole);
        entityManager.flush();

        // Then - Verify deletion
        assertThat(roleRepository.findAll()).hasSize(initialCount);
        assertThat(roleRepository.findByName("TEMP_ROLE")).isEmpty();
    }
}
