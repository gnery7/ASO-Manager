package br.com.geovanne.mensageria.controller;

import br.com.geovanne.mensageria.model.AsoEvent;
import br.com.geovanne.mensageria.service.AsoEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/asos")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Atestados de Saúde (ASO)", description = "API para recepção e gerenciamento de Atestados de Saúde Ocupacional")
public class AsoController {

    private final AsoEventService service;

    @GetMapping
    @Operation(summary = "Testar disponibilidade", description = "Retorna uma mensagem simples para validar se a API está no ar.")
    public String listarAsos() {
        return "Lista de ASOs - API em funcionamento!";
    }

    @PostMapping
    @Operation(summary = "Enviar novo ASO", description = "Recebe o JSON do atestado, salva com status PENDENTE e envia para a fila da AWS SQS.")
    public ResponseEntity<String> receberAso(@RequestBody AsoEvent asoEvent) {
        AsoEvent salvo = service.registrarAso(asoEvent);
        
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body("ASO recebido com sucesso. ID de rastreio: " + salvo.getId());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar status do ASO", description = "Busca no banco de dados o status atual de um atestado pelo seu ID.")
    public ResponseEntity<AsoEvent> consultarStatus(@PathVariable Long id) {
        return service.consultarAso(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}