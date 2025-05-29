package com.school.management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Autowired;
import com.school.management.repository.RoleRepository;
import com.school.management.entity.Role;

@SpringBootApplication
public class SchoolManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(SchoolManagementApplication.class, args);
	}

	@Bean
	public ApplicationRunner initRoles(@Autowired RoleRepository roleRepository) {
		return args -> {
			String[] roles = {"ADMIN", "MANAGER", "EMPLOYEE"};
			for (String r : roles) {
				if (roleRepository.findByName(r).isEmpty()) {
					roleRepository.save(new Role(null, r)); // Set other fields if needed
					System.out.println("[BOOTSTRAP] Created missing role: " + r);
				}
			}
		};
	}
}
