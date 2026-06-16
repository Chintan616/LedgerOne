package com.ledgerone.invoice.dto;

import com.ledgerone.invoice.entity.Client;

import java.time.LocalDateTime;

public record ClientResponse(
        Long id,
        String name,
        String companyName,
        String email,
        String phone,
        String address,
        String gstNumber,
        LocalDateTime createdAt
) {
    public static ClientResponse from(Client c) {
        return new ClientResponse(
                c.getId(), c.getName(), c.getCompanyName(),
                c.getEmail(), c.getPhone(), c.getAddress(),
                c.getGstNumber(), c.getCreatedAt()
        );
    }
}
