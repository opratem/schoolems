package com.schoolems.schoolems.repository;

import com.schoolems.schoolems.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {
}
