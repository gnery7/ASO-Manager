package br.com.geovanne.mensageria.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tb_aso_events")
public class AsoEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 11)
    private String cpfTrabalhador;

    @Column(nullable = false)
    private String resultadoAso;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusEnvio status;

    private LocalDateTime dataCriacao;

    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
        this.status = StatusEnvio.PENDENTE;
    }
}