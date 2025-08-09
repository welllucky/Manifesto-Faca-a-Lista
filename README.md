# Manifesto Faça a Lista

Servidor Express para o Manifesto Faça a Lista - uma plataforma para coleta de assinaturas digitais.

## 🚀 Como executar

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Executar em desenvolvimento (com auto-reload)

```bash
pnpm dev
```

### 3. Executar em produção

```bash
pnpm start
```

O servidor estará disponível em: `http://localhost:3000`

## 📋 Rotas Disponíveis

### Página Principal

- **GET `/`** - Serve a página do manifesto

### API de Assinaturas

- **GET `/api/signatures/count`** - Retorna o total de assinaturas
- **POST `/api/signatures`** - Registra nova assinatura
- **GET `/api/signatures`** - Lista assinaturas públicas (sem dados sensíveis)

## 🛠 Estrutura da API

### GET /api/signatures/count

Retorna a contagem total de assinaturas.

**Resposta:**

```json
{
  "success": true,
  "count": 12853,
  "baseCount": 12847,
  "newSignatures": 6
}
```

### POST /api/signatures

Registra uma nova assinatura.

**Corpo da requisição:**

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "consent": true
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "message": "Assinatura registrada com sucesso",
  "signature": {
    "id": 1234567890,
    "name": "João Silva",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Resposta de erro:**

```json
{
  "success": false,
  "error": "Nome é obrigatório e deve ter pelo menos 3 caracteres"
}
```

## 💾 Armazenamento

As assinaturas são armazenadas no arquivo `signatures.json` na raiz do projeto. Cada assinatura contém:

- `id`: Timestamp único
- `name`: Nome completo
- `email`: E-mail (opcional)
- `consent`: Consentimento booleano
- `timestamp`: Data/hora da assinatura
- `ip`: Endereço IP do signatário
- `userAgent`: User Agent do navegador
- `source`: Fonte da assinatura

## 🔒 Validações

### Nome

- Obrigatório
- Mínimo 3 caracteres
- Máximo 100 caracteres

### E-mail

- Opcional
- Se fornecido, deve ser válido

### Consentimento

- Obrigatório
- Deve ser `true`

### Duplicatas

- Não permite nomes duplicados (case-insensitive)
- Não permite e-mails duplicados (se fornecidos)

## 🎨 Frontend

O frontend é servido estaticamente e inclui:

- **index.html** - Página principal do manifesto
- **styles.css** - Estilos minimalistas com fonte Inter
- **script.js** - JavaScript para interação com a API

### Funcionalidades do Frontend

- Validação em tempo real dos campos
- Botão só habilitado quando todos os requisitos são atendidos
- Feedback visual para sucesso/erro
- Contador de assinaturas atualizado automaticamente
- Funções de compartilhamento social
- Design responsivo e acessível

## 📝 Logs

O servidor registra:

- Novas assinaturas no console
- Erros de validação e sistema
- Contagem de assinaturas

## 🔧 Personalização

Para personalizar:

1. **Número base de assinaturas**: Altere `baseCount` no arquivo `server.js`
2. **Textos da página**: Edite o arquivo `index.html`
3. **Estilos**: Modifique o arquivo `styles.css`
4. **Comportamentos**: Ajuste o arquivo `script.js`
