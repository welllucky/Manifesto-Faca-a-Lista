const { AppDataSource } = require("../database/data-source.js");
const { Signature } = require("../entities/Signature.js");

class SignatureService {
  constructor() {
    this.signatureRepository = null;
  }

  getRepository() {
    if (!this.signatureRepository) {
      this.signatureRepository = AppDataSource.getRepository(Signature);
    }
    return this.signatureRepository;
  }

  async getSignatureCount() {
    try {
      const count = await this.getRepository().count();
      return count;
    } catch (error) {
      console.error('Erro ao obter contagem de assinaturas:', error);
      throw error;
    }
  }

  async getAllSignatures() {
    try {
      const signatures = await this.getRepository().find({
        select: ["id", "name", "email", "timestamp", "source", "createdAt"],
        order: { createdAt: "DESC" }
      });
      return signatures;
    } catch (error) {
      console.error('Erro ao obter assinaturas:', error);
      throw error;
    }
  }

  async getPublicSignatures() {
    try {
      const signatures = await this.getRepository().find({
        select: ["id", "name", "timestamp", "source", "createdAt"],
        order: { createdAt: "DESC" }
      });
      return signatures;
    } catch (error) {
      console.error('Erro ao obter assinaturas públicas:', error);
      throw error;
    }
  }

  async checkDuplicateSignature(name, email) {
    try {
      const queryBuilder = this.getRepository().createQueryBuilder("signature");
      
      queryBuilder.where("LOWER(signature.name) = LOWER(:name)", { name });
      
      if (email) {
        queryBuilder.orWhere("LOWER(signature.email) = LOWER(:email)", { email });
      }
      
      const count = await queryBuilder.getCount();
      return count > 0;
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      throw error;
    }
  }

  async insertSignature(signatureData) {
    try {
      const signature = new Signature();
      signature.name = signatureData.name.trim();
      signature.email = signatureData.email ? signatureData.email.trim().toLowerCase() : undefined;
      signature.consent = signatureData.consent;
      signature.ipAddress = signatureData.ip;
      signature.userAgent = signatureData.userAgent;
      signature.source = signatureData.source || 'manifesto_page';
      signature.timestamp = new Date();

      const result = await this.getRepository().save(signature);
      return { id: result.id };
    } catch (error) {
      console.error('Erro ao inserir assinatura:', error);
      throw error;
    }
  }

  async getSignatureStats(daysBack = 30) {
    try {
      const result = await this.getRepository().query(`
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
      const signatures = await this.getRepository().find({
        select: ["id", "name", "timestamp", "source"],
        order: { createdAt: "DESC" },
        take: limit
      });
      return signatures;
    } catch (error) {
      console.error('Erro ao obter assinaturas recentes:', error);
      throw error;
    }
  }
}

module.exports = { SignatureService };