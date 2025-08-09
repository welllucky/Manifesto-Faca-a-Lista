require('reflect-metadata');
// Only load .env in development (not in Docker/production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const { AppDataSource } = require('./database/data-source.js');
const { SignatureService } = require('./services/SignatureService.js');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')));
app.use('/script.js', express.static(path.join(__dirname, 'script.js')));


function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para fornecer configurações ao frontend
app.get('/api/config', (req, res) => {
  res.json({
    BASE_URL: BASE_URL,
    WHATSAPP_BASE_URL: process.env.WHATSAPP_BASE_URL || 'https://wa.me/',
    TWITTER_BASE_URL: process.env.TWITTER_BASE_URL || 'https://twitter.com/intent/tweet',
    FACEBOOK_BASE_URL: process.env.FACEBOOK_BASE_URL || 'https://www.facebook.com/sharer/sharer.php'
  });
});

app.get('/api/signatures/count', async (req, res) => {
  try {
    const signatureService = new SignatureService();
    const totalCount = await signatureService.getSignatureCount();

    res.json({
      success: true,
      count: totalCount
    });
  } catch (error) {
    console.error('Erro ao obter contagem de assinaturas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

app.post('/api/signatures', async (req, res) => {
  try {
    const { name, email, consent } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório e deve ter pelo menos 3 caracteres'
      });
    }

    if (!consent) {
      return res.status(400).json({
        success: false,
        error: 'Consentimento é obrigatório'
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'E-mail inválido'
      });
    }

    const signatureService = new SignatureService();
    const isDuplicate = await signatureService.checkDuplicateSignature(name.trim(), email);

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        error: 'Esta assinatura já foi registrada'
      });
    }

    const signatureData = {
      name: name.trim(),
      email: email ? email.trim() : null,
      consent: consent,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      source: 'manifesto_page'
    };

    const result = await signatureService.insertSignature(signatureData);

    console.log(`Nova assinatura registrada: ${name} (${email || 'sem email'})`);

    res.status(201).json({
      success: true,
      message: 'Assinatura registrada com sucesso',
      signature: {
        id: result.id,
        name: signatureData.name,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao registrar assinatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

app.get('/api/signatures', async (req, res) => {
  try {
    const signatures = await signatureService.getPublicSignatures();
    const publicSignatures = signatures.map(sig => ({
      id: sig.id,
      name: sig.name,
      timestamp: sig.timestamp
    }));

    res.json({
      success: true,
      signatures: publicSignatures,
      count: signatures.length
    });
  } catch (error) {
    console.error('Erro ao obter assinaturas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Inicializar conexão com banco e servidor
async function startServer() {
  try {
    // Debug: Log database configuration
    console.log("🔧 Configuração do banco:");
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'faca_a_lista_manifesto'}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]'}`);
    
    await AppDataSource.initialize();
    console.log("✅ Conexão com MariaDB estabelecida com sucesso!");
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor do Manifesto Faça a Lista rodando na porta ${PORT}`);
      console.log(`📄 Acesse: ${BASE_URL}`);
      console.log(`📊 API de contagem: ${BASE_URL}/api/signatures/count`);
      console.log(`✍️  API de assinaturas: ${BASE_URL}/api/signatures`);
    });
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    process.exit(1);
  }
}

startServer();