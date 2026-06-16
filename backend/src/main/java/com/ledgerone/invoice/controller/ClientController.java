package com.ledgerone.invoice.controller;

import com.ledgerone.invoice.dto.ClientRequest;
import com.ledgerone.invoice.dto.ClientResponse;
import com.ledgerone.invoice.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public ResponseEntity<List<ClientResponse>> getAll(Authentication authentication) {
        return ResponseEntity.ok(clientService.getAllClients(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getOne(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(clientService.getClient(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<ClientResponse> create(
            @Valid @RequestBody ClientRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientService.createClient(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(clientService.updateClient(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        clientService.deleteClient(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
