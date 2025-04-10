package com.schoolems.schoolems.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    private String name; //Only for registration
    private String email;
    private String password;
    private String role; // "ADMIN", "MANAGER", "EMPLOYEE"
}
