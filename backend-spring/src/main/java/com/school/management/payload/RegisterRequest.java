package com.school.management.payload;

import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;

@Data
public class RegisterRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @Email
    private String email;

    // Optional: ID of employee this user account is linked to (for EMPLOYEE role)
    private Long employeeId;

    // Role(s) to assign (ADMIN should restrict in front/backend to authorized personnel!)
    @Size(min=1)
    private Set<String> roles;

    // New fields for employee registration
    private String name;
    private String department;
    private String position;
    private String contactInfo;
    private LocalDate startDate;
}
