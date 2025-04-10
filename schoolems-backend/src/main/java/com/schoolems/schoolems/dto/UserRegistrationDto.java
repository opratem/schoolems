package com.schoolems.schoolems.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationDto {
    private String name;
    private String email;
    private String password;
    private String department;
    private String role; // Properly defined role field

    // Custom password validation
    public void setPassword(String password) {
        if (password == null || password.length() < 7) {
            throw new IllegalArgumentException("Password must be at least 7 characters");
        }
        this.password = password;
    }

    // Proper role setter with validation
    public void setRole(String role) {
        if (role == null || !List.of("EMPLOYEE", "MANAGER", "ADMIN").contains(role)) {
            throw new IllegalArgumentException("Invalid role specified");
        }
        this.role = role;
    }
}