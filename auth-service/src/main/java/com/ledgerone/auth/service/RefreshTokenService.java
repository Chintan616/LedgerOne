package com.ledgerone.auth.service;

import com.ledgerone.auth.entity.RefreshToken;
import com.ledgerone.auth.entity.User;
import com.ledgerone.auth.exception.AppException;
import com.ledgerone.auth.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(refreshTokenExpiration));

        return refreshTokenRepository.save(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new AppException("Refresh token expired. Please log in again.", HttpStatus.UNAUTHORIZED);
        }
        return token;
    }

    @Transactional
    public void deleteByToken(String tokenValue) {
        refreshTokenRepository.findByToken(tokenValue)
                .ifPresent(refreshTokenRepository::delete);
    }
}
