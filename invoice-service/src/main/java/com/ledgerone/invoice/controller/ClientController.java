package com.ledgerone.invoice.controller;

import com.ledgerone.invoice.dto.ClientRequest;
import com.ledgerone.invoice.dto.ClientResponse;
import com.ledgerone.invoice.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<ClientResponse>> getAll(
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(clientService.getAllClients(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getOne(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(clientService.getClient(id, userEmail));
    }

    @PostMapping
    public ResponseEntity<ClientResponse> create(
            @Valid @RequestBody ClientRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clientService.createClient(request, userEmail));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(clientService.updateClient(id, request, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Email") String userEmail) {
        clientService.deleteClient(id, userEmail);
        return ResponseEntity.noContent().build();
    }
}
