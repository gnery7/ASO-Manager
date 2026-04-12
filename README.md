# 🏥 ASO Manager - Integração eSocial & Mensageria SQS

O **ASO Manager** é uma plataforma Full Stack desenvolvida para gerenciar a transmissão de Atestados de Saúde Ocupacional (ASOs), simulando a integração com sistemas governamentais.

Este projeto foi construído para demonstrar uma arquitetura moderna baseada em **Microsserviços, Processamento Assíncrono (Mensageria) e Single Page Applications (SPA)**, garantindo alta disponibilidade, resiliência e uma excelente experiência de usuário.

---

## 🏗️ Arquitetura do Projeto (Monorepo)

O projeto está dividido em duas partes principais dentro deste repositório:

* **`/backend`**: API RESTful construída em Java com Spring Boot. Responsável por receber os dados, persistir no banco e gerenciar a fila de mensageria na nuvem.
* **`/frontend`**: Interface de usuário (SPA) construída com React e Vite. Consome a API, realiza polling para atualização de status em tempo real e exibe logs dinâmicos.

---

## 🚀 Tecnologias Utilizadas

### Backend
* **Java 21**
* **Spring Boot 3.3** (Web, Data JPA, Validation)
* **Spring Cloud AWS** (Integração nativa com a infraestrutura Amazon)
* **Amazon SQS** (Serviço de fila de mensagens da AWS)
* **MySQL** (Banco de dados relacional rodando via Docker)
* **Swagger / OpenAPI** (Documentação automatizada da API)

### Frontend
* **React 18** (Biblioteca UI)
* **Vite** (Build tool e servidor de desenvolvimento)
* **JavaScript (ES6+) & CSS3** (Interface componentizada e responsiva)
* **Fetch API** (Comunicação HTTP e Polling)

---

## 🧠 Como o Fluxo de Mensageria Funciona?

Para evitar sobrecarga no banco de dados e garantir que nenhum atestado seja perdido em caso de instabilidade de sistemas externos (eSocial), o projeto utiliza o padrão **Producer/Consumer**:

1. **Recepção (Frontend -> API):** O React envia o JSON do ASO para o Spring Boot.
2. **Producer (API -> MySQL & AWS):** O Java salva o atestado localmente com o status `PENDENTE` e publica a mensagem na fila do **Amazon SQS**. O Frontend recebe um status HTTP `202 (Accepted)`.
3. **Polling (Frontend -> API):** O React entra em um loop (a cada 2s), perguntando à API se o status do documento mudou.
4. **Consumer (AWS -> API -> MySQL):** Em background, um `@SqsListener` escuta a fila da Amazon. Ao detectar a mensagem, ele processa a "regra de negócio", muda o status no MySQL para `CONCLUIDO` e deleta a mensagem da fila.
5. **Feedback Visual:** Na próxima consulta do Polling, o React recebe o status `CONCLUIDO` e atualiza a interface (Tabela e Terminal de Logs) em tempo real.

---

## ⚙️ Como executar o projeto localmente

### Pré-requisitos
* **Java 21** ou superior
* **Node.js** v18+ e npm
* **Docker**
* Conta na **AWS** (Free Tier) com uma fila SQS chamada `app-mensageria` criada na região `us-east-1`.

### 1. Subindo o Banco de Dados (Docker)
Abra o seu terminal e execute o comando abaixo para iniciar o container do MySQL:
```bash
docker run --name mysql-mensageria -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=mensageria_db -p 3306:3306 -d mysql:8.0
```

### 2. Configurando as Credenciais da AWS
Dentro da pasta `/backend/src/main/resources/`, crie um arquivo chamado `application-secrets.properties` e adicione suas chaves da AWS:
```properties
spring.cloud.aws.credentials.access-key=SUA_ACCESS_KEY
spring.cloud.aws.credentials.secret-key=SUA_SECRET_KEY
```
*(Nota: Este arquivo está ignorado pelo `.gitignore` para não vazar credenciais).*

### 3. Rodando a API (Backend)
Abra um terminal na pasta `/backend` e inicie o servidor Spring Boot:
```bash
cd backend
./mvnw spring-boot:run
```
A API estará disponível em `http://localhost:8080`. (Acesse `http://localhost:8080/swagger-ui/index.html` para ver a documentação).

### 4. Rodando a Interface (Frontend)
Abra um novo terminal na pasta `/frontend`, instale as dependências e inicie o Vite:
```bash
cd frontend
npm install
npm run dev
```
O sistema estará pronto para uso em `http://localhost:5173`.
