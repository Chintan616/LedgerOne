package com.ledgerone.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class AiServiceConfig {

    @Value("${ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    @Bean("aiRestClient")
    public RestClient aiRestClient() {
        return RestClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }
}
