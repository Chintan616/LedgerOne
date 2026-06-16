package com.ledgerone.invoice.repository;

import com.ledgerone.invoice.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByUserEmailOrderByNameAsc(String userEmail);
    Optional<Client> findByIdAndUserEmail(Long id, String userEmail);
}
