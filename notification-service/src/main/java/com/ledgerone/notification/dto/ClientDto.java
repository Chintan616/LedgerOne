package com.ledgerone.notification.dto;

public record ClientDto(
        Long id,
        String name,
        String companyName,
        String email
) {}
