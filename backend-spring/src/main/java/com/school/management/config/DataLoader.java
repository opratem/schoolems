package com.school.management.config;

import com.school.management.entity.Role;
import com.school.management.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements ApplicationRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("[DEBUG] DataLoader: Initializing required roles...");

        // Create default roles if they don't exist
        createRoleIfNotExists("ADMIN");
        createRoleIfNotExists("MANAGER");
        createRoleIfNotExists("EMPLOYEE");

        System.out.println("[DEBUG] DataLoader: Role initialization complete");
    }

    private void createRoleIfNotExists(String roleName) {
        if (roleRepository.findByName(roleName).isEmpty()) {
            Role role = Role.builder()
                    .name(roleName)
                    .build();
            roleRepository.save(role);
            System.out.println("[DEBUG] DataLoader: Created role: " + roleName);
        } else {
            System.out.println("[DEBUG] DataLoader: Role already exists: " + roleName);
        }
    }
}
