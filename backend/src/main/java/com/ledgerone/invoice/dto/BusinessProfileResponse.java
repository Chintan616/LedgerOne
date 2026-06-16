package com.ledgerone.invoice.dto;

import com.ledgerone.invoice.entity.BusinessProfile;

public record BusinessProfileResponse(
        Long id,
        String companyName,
        String address,
        String phone,
        String email,
        String gstNumber,
        String bankName,
        String accountNumber,
        String ifscCode
) {
    public static BusinessProfileResponse from(BusinessProfile profile) {
        if (profile == null) return null;
        return new BusinessProfileResponse(
                profile.getId(),
                profile.getCompanyName(),
                profile.getAddress(),
                profile.getPhone(),
                profile.getEmail(),
                profile.getGstNumber(),
                profile.getBankName(),
                profile.getAccountNumber(),
                profile.getIfscCode()
        );
    }
}
