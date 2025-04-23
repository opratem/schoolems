package com.schoolems.schoolems.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class LeaveRequestDTO {
    private String type; //e.g "SICK" or "VACATION"
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
