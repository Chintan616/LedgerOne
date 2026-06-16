package com.ledgerone.invoice.service;

import com.ledgerone.invoice.dto.ClientRequest;
import com.ledgerone.invoice.dto.ClientResponse;
import com.ledgerone.invoice.entity.Client;
import com.ledgerone.exception.AppException;
import com.ledgerone.invoice.repository.ClientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public List<ClientResponse> getAllClients(String userEmail) {
        return clientRepository.findByUserEmailOrderByNameAsc(userEmail)
                .stream().map(ClientResponse::from).toList();
    }

    public ClientResponse getClient(Long id, String userEmail) {
        Client client = clientRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new AppException("Client not found", HttpStatus.NOT_FOUND));
        return ClientResponse.from(client);
    }

    public ClientResponse createClient(ClientRequest request, String userEmail) {
        Client client = new Client();
        client.setUserEmail(userEmail);
        mapRequestToClient(request, client);
        return ClientResponse.from(clientRepository.save(client));
    }

    public ClientResponse updateClient(Long id, ClientRequest request, String userEmail) {
        Client client = clientRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new AppException("Client not found", HttpStatus.NOT_FOUND));
        mapRequestToClient(request, client);
        return ClientResponse.from(clientRepository.save(client));
    }

    public void deleteClient(Long id, String userEmail) {
        Client client = clientRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new AppException("Client not found", HttpStatus.NOT_FOUND));
        clientRepository.delete(client);
    }

    private void mapRequestToClient(ClientRequest request, Client client) {
        client.setName(request.name());
        client.setCompanyName(request.companyName());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setAddress(request.address());
        client.setGstNumber(request.gstNumber());
    }
}
