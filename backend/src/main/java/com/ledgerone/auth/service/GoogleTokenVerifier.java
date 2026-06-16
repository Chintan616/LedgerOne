package com.ledgerone.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ledgerone.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Verifies a Google Identity Services ID token by delegating signature/expiry
 * checks to Google's own tokeninfo endpoint, rather than validating the JWT
 * signature locally against Google's rotating public keys.
 */
@Service
public class GoogleTokenVerifier {

    private final RestClient restClient = RestClient.create();

    @Value("${google.client-id}")
    private String googleClientId;

    public GoogleUserInfo verify(String idToken) {
        JsonNode body;
        try {
            body = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idToken)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            throw new AppException("Invalid Google token", HttpStatus.UNAUTHORIZED);
        }

        if (body == null || !googleClientId.equals(body.path("aud").asText())) {
            throw new AppException("Invalid Google token", HttpStatus.UNAUTHORIZED);
        }
        if (!"true".equals(body.path("email_verified").asText())) {
            throw new AppException("Google account email is not verified", HttpStatus.UNAUTHORIZED);
        }

        String email = body.path("email").asText();
        String name = body.path("name").asText(email);
        return new GoogleUserInfo(email, name);
    }

    public record GoogleUserInfo(String email, String name) {}
}
