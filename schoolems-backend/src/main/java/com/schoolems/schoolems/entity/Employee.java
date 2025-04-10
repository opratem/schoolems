package com.schoolems.schoolems.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String department;
    private String position;
    private String email;
    private String phone;
    private LocalDate startDate;

    @OneToMany(mappedBy = "employee")
    private List<LeaveRequest> leaveRequests;
}
