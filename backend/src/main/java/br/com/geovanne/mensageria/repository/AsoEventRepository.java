package br.com.geovanne.mensageria.repository;

import br.com.geovanne.mensageria.model.AsoEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AsoEventRepository extends JpaRepository<AsoEvent, Long> {
}