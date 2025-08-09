const { query } = require('./config');

class SignatureService {

  async getSignatureCount() {
    try {
      const result = await query('SELECT COUNT(*) as total FROM signatures');
      return result[0].total || 0;
    } catch (error) {
      console.error('Erro ao obter contagem de assinaturas:', error);
      throw error;
    }
  }

  async getAllSignatures() {
    try {
      const signatures = await query(`
        SELECT id, name, email, timestamp, source, created_at
        FROM signatures
        ORDER BY created_at DESC
      `);
      return signatures;
    } catch (error) {
      console.error('Erro ao obter assinaturas:', error);
      throw error;
    }
  }

  async getPublicSignatures() {
    try {
      const signatures = await query(`
        SELECT id, name, timestamp, source, created_at
        FROM signatures
        ORDER BY created_at DESC
      `);
      return signatures;
    } catch (error) {
      console.error('Erro ao obter assinaturas públicas:', error);
      throw error;
    }
  }

  async checkDuplicateSignature(name, email) {
    try {
      const params = [name.toLowerCase()];
      let sql = 'SELECT COUNT(*) as count FROM signatures WHERE LOWER(name) = ?';

      if (email) {
        sql += ' OR LOWER(email) = ?';
        params.push(email.toLowerCase());
      }

      const result = await query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      throw error;
    }
  }

  async insertSignature(signatureData) {
    try {
      const { name, email, consent, ip, userAgent, source } = signatureData;

      const result = await query(`
        INSERT INTO signatures (name, email, consent, ip_address, user_agent, source)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, email, consent ? 1 : 0, ip, userAgent, source || 'manifesto_page']);

      return { id: result.insertId };
    } catch (error) {
      console.error('Erro ao inserir assinatura:', error);
      throw error;
    }
  }

  async getSignatureStats(daysBack = 30) {
    try {
      const result = await query(`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count,
          COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
          COUNT(CASE WHEN email IS NULL THEN 1 END) as without_email
        FROM signatures
        WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [daysBack]);
      return result;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  async getRecentSignatures(limit = 10) {
    try {
      const signatures = await query(`
        SELECT id, name, timestamp, source
        FROM signatures
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit]);
      return signatures;
    } catch (error) {
      console.error('Erro ao obter assinaturas recentes:', error);
      throw error;
    }
  }
}

module.exports = new SignatureService();