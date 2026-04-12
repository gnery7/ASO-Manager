import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [view, setView] = useState('form'); 
  const [cpf, setCpf] = useState('');
  const [resultado, setResultado] = useState('APTO');

  const [isProcessing, setIsProcessing] = useState(false);
  const [timelineStep, setTimelineStep] = useState(0);
  
  const [asoList, setAsoList] = useState([]); 
  const [modalAberto, setModalAberto] = useState(false);
  const [asoSelecionado, setAsoSelecionado] = useState(null);

  useEffect(() => {
    const pendentes = asoList.filter(aso => aso.status === 'PENDENTE');
    if (pendentes.length === 0) return; 

    const interval = setInterval(() => {
      pendentes.forEach(async (aso) => {
        try {
          const res = await fetch(`http://localhost:8080/api/v1/asos/${aso.id}`);
          if (res.ok) {
            const data = await res.json();
            
            if (data.status === 'CONCLUIDO') {
              const horaAtual = new Date().toLocaleTimeString();
              setAsoList(prevList =>
                prevList.map(item => {
                  if (item.id === aso.id) {
                    const novosLogs = [
                      ...item.logs,
                      `[${horaAtual}] [AWS SQS] -> Opa! Chegou mensagem nova na fila! CPF: ${item.cpf}`,
                      `[${horaAtual}] [SISTEMA] -> Processando ASO ID: ${item.id}...`,
                      `[${horaAtual}] [BANCO] -> Status do ASO ${item.id} atualizado para CONCLUIDO com sucesso!`
                    ];
                    return { ...item, status: 'CONCLUIDO', logs: novosLogs };
                  }
                  return item;
                })
              );
            }
          }
        } catch (error) {
          console.error(`Erro ao consultar status do ID ${aso.id}`, error);
        }
      });
    }, 2000);

    return () => clearInterval(interval); 
  }, [asoList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimelineStep(1);

    try {
      const response = await fetch('http://localhost:8080/api/v1/asos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfTrabalhador: cpf, resultadoAso: resultado })
      });

      if (response.status === 202) {
        const text = await response.text(); 
        const match = text.match(/ID de rastreio: (\d+)/);
        const idGerado = match ? match[1] : Math.floor(Math.random() * 1000);
        const horaAtual = new Date().toLocaleTimeString();

        const logsIniciais = [
          `[${horaAtual}] [SISTEMA] -> POST /api/v1/asos recebido.`,
          `[${horaAtual}] [BANCO] -> Insert into tb_aso_events realizado. Status: PENDENTE.`,
          `[${horaAtual}] [AWS SQS] -> Mensagem enviada para a fila 'app-mensageria'.`
        ];

        const novoAso = {
          id: idGerado,
          cpf: cpf,
          status: 'PENDENTE',
          horaEnvio: horaAtual,
          logs: logsIniciais
        };

        setTimeout(() => setTimelineStep(2), 800); // 2. Fila
        setTimeout(() => setTimelineStep(3), 1800); // 3. Worker
        setTimeout(() => {
          setAsoList(prev => [novoAso, ...prev]); 
          setCpf('');
          setIsProcessing(false);
          setTimelineStep(0);
          setView('dashboard'); 
        }, 2800);

      } else {
        alert("Erro na API Java. Status: " + response.status);
        setIsProcessing(false);
      }
    } catch (error) {
      alert("Erro de conexão! O Spring Boot está rodando?");
      setIsProcessing(false);
    }
  };

  const abrirLogs = (aso) => {
    const asoAtualizado = asoList.find(item => item.id === aso.id);
    setAsoSelecionado(asoAtualizado);
    setModalAberto(true);
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>ASO <span>Manager</span></h1>
        <p>Sistema de Integração e Mensageria AWS SQS</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${view === 'form' ? 'active' : ''}`} onClick={() => !isProcessing && setView('form')}>
          ➕ Novo ASO
        </button>
        <button className={`tab-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => !isProcessing && setView('dashboard')}>
          📊 Monitoramento
        </button>
      </div>

      <div className="card">
        {view === 'form' && !isProcessing && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>CPF do Trabalhador</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 12345678901"
                required
                maxLength="11"
              />
            </div>
            <div className="form-group">
              <label>Resultado do Exame</label>
              <select value={resultado} onChange={(e) => setResultado(e.target.value)}>
                <option value="APTO">Apto para a função</option>
                <option value="INAPTO">Inapto para a função</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Transmitir Dados
            </button>
          </form>
        )}

        {view === 'form' && isProcessing && (
          <div className="timeline">
            <h3 style={{ textAlign: 'center', color: '#475569' }}>Processando Integração...</h3>
            <div className={`timeline-item ${timelineStep >= 1 ? 'success' : ''}`}>
              {timelineStep >= 1 ? '✅ 1. Recebido na API Local' : '⏳ 1. Recebendo JSON...'}
            </div>
            <div className={`timeline-item ${timelineStep >= 2 ? 'success' : timelineStep === 1 ? 'active' : ''}`}>
              {timelineStep >= 2 ? '✅ 2. Enviado para AWS SQS' : '⏳ 2. Conectando com a Nuvem...'}
            </div>
            <div className={`timeline-item ${timelineStep >= 3 ? 'success' : timelineStep === 2 ? 'active' : ''}`}>
              {timelineStep >= 3 ? '✅ 3. Registro Salvo com Sucesso' : '⏳ 3. Persistindo no Banco...'}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Protocolo ID</th>
                  <th>CPF</th>
                  <th>Hora do Envio</th>
                  <th>Status SQS</th>
                  <th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {asoList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Nenhum ASO transmitido nesta sessão.
                    </td>
                  </tr>
                ) : (
                  asoList.map((aso) => (
                    <tr key={aso.id}>
                      <td style={{ fontWeight: '600' }}>#{aso.id}</td>
                      <td>{aso.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</td>
                      <td>{aso.horaEnvio}</td>
                      <td>
                        <span className={`status-badge ${aso.status === 'CONCLUIDO' ? 'status-success' : 'status-pending'}`}>
                          {aso.status === 'CONCLUIDO' ? '✔ CONCLUÍDO' : '⏳ PROCESSANDO...'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-logs" onClick={() => abrirLogs(aso)}>
                          Ver Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && asoSelecionado && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-terminal" onClick={e => e.stopPropagation()}>
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="dot dot-red" onClick={() => setModalAberto(false)}></div>
                <div className="dot dot-yellow"></div>
                <div className="dot dot-green"></div>
              </div>
              <div className="terminal-title">
                bash - SpringBoot_Worker ~ /api/logs
              </div>
              <div style={{ width: '36px' }}></div> {/* Spacer for centering */}
            </div>
            
            <div className="terminal-body">
              {asoList.find(a => a.id === asoSelecionado.id)?.logs.map((log, index) => (
                <div key={index} className="terminal-log">
                  {log}
                </div>
              ))}
              
              {asoList.find(a => a.id === asoSelecionado.id)?.status === 'PENDENTE' && (
                <div style={{ color: '#64748b', marginTop: '12px' }}>
                  Aguardando @SqsListener consumir a fila... <span className="terminal-cursor"></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;