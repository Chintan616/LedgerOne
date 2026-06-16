package com.ledgerone.invoice.repository;

import com.ledgerone.invoice.entity.Invoice;
import com.ledgerone.invoice.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    Optional<Invoice> findByIdAndUserEmail(Long id, String userEmail);
    List<Invoice> findByStatusAndDueDateBefore(InvoiceStatus status, LocalDate date);
}
