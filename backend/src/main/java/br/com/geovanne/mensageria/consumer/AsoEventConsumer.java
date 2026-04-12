package br.com.geovanne.mensageria.consumer;

import br.com.geovanne.mensageria.model.AsoEvent;
import br.com.geovanne.mensageria.model.StatusEnvio;
import br.com.geovanne.mensageria.repository.AsoEventRepository;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AsoEventConsumer {

    private final AsoEventRepository repository;

    @SqsListener("app-mensageria")
    public void processarAso(AsoEvent asoEvent) {
        System.out.println("\n[AWS SQS] -> Opa! Chegou mensagem nova na fila! CPF: " + asoEvent.getCpfTrabalhador());

        repository.findById(asoEvent.getId()).ifPresent(aso -> {
            
            System.out.println("[SISTEMA] -> Processando ASO ID: " + aso.getId() + "...");

            aso.setStatus(StatusEnvio.CONCLUIDO);
            repository.save(aso);
            
            System.out.println("[BANCO] -> Status do ASO " + aso.getId() + " atualizado para CONCLUIDO com sucesso!\n");
        });
    }
}