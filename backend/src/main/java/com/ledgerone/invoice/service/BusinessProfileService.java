package com.ledgerone.invoice.service;

import com.ledgerone.invoice.dto.BusinessProfileRequest;
import com.ledgerone.invoice.dto.BusinessProfileResponse;
import com.ledgerone.invoice.entity.BusinessProfile;
import com.ledgerone.invoice.repository.BusinessProfileRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BusinessProfileService {

    private final BusinessProfileRepository repository;

    public BusinessProfileService(BusinessProfileRepository repository) {
        this.repository = repository;
    }

    public BusinessProfileResponse getProfile(String userEmail) {
        return repository.findByUserEmail(userEmail)
                .map(BusinessProfileResponse::from)
                .orElse(null); // Return null if not set, frontend can handle empty state
    }

    public BusinessProfileResponse updateProfile(BusinessProfileRequest request, String userEmail) {
        BusinessProfile profile = repository.findByUserEmail(userEmail).orElse(new BusinessProfile());
        profile.setUserEmail(userEmail);
        profile.setCompanyName(request.companyName());
        profile.setAddress(request.address());
        profile.setPhone(request.phone());
        profile.setEmail(request.email());
        profile.setGstNumber(request.gstNumber());
        profile.setBankName(request.bankName());
        profile.setAccountNumber(request.accountNumber());
        profile.setIfscCode(request.ifscCode());

        return BusinessProfileResponse.from(repository.save(profile));
    }

    public BusinessProfile getProfileEntity(String userEmail) {
        return repository.findByUserEmail(userEmail).orElse(null);
    }
}
