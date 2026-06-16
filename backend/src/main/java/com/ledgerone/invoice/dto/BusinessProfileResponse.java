package com.ledgerone.invoice.dto;

import com.ledgerone.invoice.entity.BusinessProfile;

public record BusinessProfileResponse(
        Long id,
        String companyName,
        String address,
        String phone,
        String email,
        String gstNumber
) {
    public static BusinessProfileResponse from(BusinessProfile profile) {
        if (profile == null) return null;
        return new BusinessProfileResponse(
                profile.getId(),
                profile.getCompanyName(),
                profile.getAddress(),
                profile.getPhone(),
                profile.getEmail(),
                profile.getGstNumber()
        );
    }
}
