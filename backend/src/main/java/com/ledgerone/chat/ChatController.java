package com.ledgerone.chat;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ledgerone.chat.dto.ChatRequest;
import com.ledgerone.chat.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RestClient aiRestClient;

    public ChatController(@Qualifier("aiRestClient") RestClient aiRestClient) {
        this.aiRestClient = aiRestClient;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @RequestBody ChatRequest req,
            Authentication authentication) {

        var aiRequest = new AiChatRequest(
                req.message(),
                req.conversationId(),
                authentication.getName()
        );

        AiChatResponse aiResponse = aiRestClient.post()
                .uri("/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(aiRequest)
                .retrieve()
                .body(AiChatResponse.class);

        return ResponseEntity.ok(
                new ChatResponse(aiResponse.reply(), aiResponse.conversationId())
        );
    }

    // Internal DTOs — only used for the Spring Boot <-> Python channel

    private record AiChatRequest(
            @JsonProperty("message") String message,
            @JsonProperty("conversation_id") String conversationId,
            @JsonProperty("user_email") String userEmail
    ) {}

    private record AiChatResponse(
            @JsonProperty("reply") String reply,
            @JsonProperty("conversation_id") String conversationId
    ) {}
}
