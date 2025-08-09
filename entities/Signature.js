const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } = require("typeorm");

const Signature = class {
    constructor() {
        this.id = undefined;
        this.name = '';
        this.email = undefined;
        this.consent = true;
        this.timestamp = new Date();
        this.ipAddress = undefined;
        this.userAgent = undefined;
        this.source = 'manifesto_page';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
};

Entity("signatures")(Signature);
Index("idx_signatures_timestamp", ["timestamp"])(Signature);
Index("idx_signatures_source", ["source"])(Signature);
Index("idx_signatures_created_at", ["createdAt"])(Signature);
Index("idx_signatures_name_lower", ["name"], { unique: true })(Signature);
Index("idx_signatures_email_lower", ["email"], { unique: true })(Signature);

PrimaryGeneratedColumn("increment", { type: "bigint" })(Signature.prototype, "id");
Column({ type: "varchar", length: 100 })(Signature.prototype, "name");
Column({ type: "varchar", length: 255, nullable: true })(Signature.prototype, "email");
Column({ type: "tinyint", width: 1, default: 1 })(Signature.prototype, "consent");
Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })(Signature.prototype, "timestamp");
Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })(Signature.prototype, "ipAddress");
Column({ name: "user_agent", type: "text", nullable: true })(Signature.prototype, "userAgent");
Column({ type: "varchar", length: 50, default: "manifesto_page" })(Signature.prototype, "source");
CreateDateColumn({ name: "created_at", type: "datetime" })(Signature.prototype, "createdAt");
UpdateDateColumn({ name: "updated_at", type: "datetime" })(Signature.prototype, "updatedAt");

module.exports = { Signature };