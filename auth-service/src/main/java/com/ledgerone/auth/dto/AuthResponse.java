package com.ledgerone.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, String name, String email) {}
