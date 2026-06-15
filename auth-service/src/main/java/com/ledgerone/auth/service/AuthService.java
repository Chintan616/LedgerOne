package com.ledgerone.auth.service;

import com.ledgerone.auth.dto.AuthResponse;
import com.ledgerone.auth.dto.LoginRequest;
import com.ledgerone.auth.dto.RefreshTokenRequest;
import com.ledgerone.auth.dto.RegisterRequest;
import com.ledgerone.auth.entity.RefreshToken;
import com.ledgerone.auth.entity.User;
import com.ledgerone.auth.exception.AppException;
import com.ledgerone.auth.repository.RefreshTokenRepository;
import com.ledgerone.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            RefreshTokenService refreshTokenService,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException("Email already in use", HttpStatus.CONFLICT);
        }

        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken.getToken(), user.getName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        String accessToken = jwtService.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken.getToken(), user.getName(), user.getEmail());
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        refreshTokenService.verifyExpiration(refreshToken);

        String accessToken = jwtService.generateToken(refreshToken.getUser().getEmail());
        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                refreshToken.getUser().getName(),
                refreshToken.getUser().getEmail()
        );
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.deleteByToken(request.refreshToken());
    }
}
