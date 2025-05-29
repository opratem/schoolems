package com.school.management.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "employees")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;



    @NotBlank
    @Column(nullable = false, unique = true)
    private String employeeId;

    @NotBlank
    @Column(nullable = false)
    private String department;

    @NotBlank
    @Column(nullable = false)
    private String position;

    @NotBlank
    @Column(nullable = false)
    private String contactInfo;

    @PastOrPresent
    @Column(nullable = false)
    private LocalDate startDate;

    // Bidirectional relationship (optional, not required)
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("employee")
    private List<LeaveRequest> leaveRequests = new ArrayList<>();
}
