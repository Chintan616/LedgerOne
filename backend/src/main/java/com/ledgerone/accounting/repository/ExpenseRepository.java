package com.ledgerone.accounting.repository;

import com.ledgerone.accounting.entity.Expense;
import com.ledgerone.accounting.entity.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserEmailOrderByDateDesc(String userEmail);
    Optional<Expense> findByIdAndUserEmail(Long id, String userEmail);
    List<Expense> findByUserEmailAndDateBetweenOrderByDateDesc(String userEmail, LocalDate from, LocalDate to);
}
