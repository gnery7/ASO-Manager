package br.com.geovanne.mensageria.service;

import br.com.geovanne.mensageria.model.AsoEvent;
import br.com.geovanne.mensageria.repository.AsoEventRepository;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AsoEventService {

    private final AsoEventRepository repository;
    private final SqsTemplate sqsTemplate;

    public AsoEvent registrarAso(AsoEvent asoEvent) {
        AsoEvent asoSalvo = repository.save(asoEvent);

        sqsTemplate.send("app-mensageria", asoSalvo);
        
        return asoSalvo;
    }
    public java.util.Optional<AsoEvent> consultarAso(Long id) {
        return repository.findById(id);
    }
}