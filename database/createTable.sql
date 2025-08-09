-- CREATE DATABASE manifesto_faca_a_lista CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE manifesto_faca_a_lista;

CREATE TABLE signatures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    consent TINYINT(1) NOT NULL DEFAULT 1,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manifesto_page',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_signatures_timestamp (timestamp),
    INDEX idx_signatures_source (source),
    INDEX idx_signatures_created_at (created_at),
    UNIQUE INDEX idx_signatures_name_lower (name),
    UNIQUE INDEX idx_signatures_email_lower (email)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activity_logs_action (action),
    INDEX idx_activity_logs_entity (entity_type, entity_id),
    INDEX idx_activity_logs_created_at (created_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE VIEW signature_stats AS
SELECT
    COUNT(*) as total_signatures,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as signatures_with_email,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as signatures_without_email,
    DATE(timestamp) as day,
    COUNT(*) as daily_count
FROM signatures
GROUP BY DATE(timestamp)
ORDER BY day DESC;

CREATE VIEW public_signatures AS
SELECT
    id,
    name,
    timestamp,
    source,
    created_at
FROM signatures
ORDER BY created_at DESC;

DELIMITER //
CREATE FUNCTION get_total_signature_count()
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE current_count INT DEFAULT 0;

    SELECT COUNT(*) INTO current_count FROM signatures;

    RETURN IFNULL(current_count, 0);
END //
DELIMITER ;

CREATE PROCEDURE insert_signature(
    IN p_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_consent TINYINT(1),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_source VARCHAR(50)
)
BEGIN
    DECLARE signature_id BIGINT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Inserir assinatura
    INSERT INTO signatures (name, email, consent, ip_address, user_agent, source)
    VALUES (p_name, p_email, p_consent, p_ip_address, p_user_agent, p_source);

    SET signature_id = LAST_INSERT_ID();

    -- Log da atividade
    INSERT INTO activity_logs (action, entity_type, entity_id, ip_address, user_agent)
    VALUES ('create', 'signature', signature_id, p_ip_address, p_user_agent);

    COMMIT;

    SELECT signature_id as id;
END //
DELIMITER ;

CREATE PROCEDURE get_signature_statistics(IN days_back INT)
BEGIN
    SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
        COUNT(CASE WHEN email IS NULL THEN 1 END) as without_email
    FROM signatures
    WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL days_back DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
END //
DELIMITER ;

ALTER TABLE signatures COMMENT = 'Tabela de assinaturas do manifesto';
ALTER TABLE activity_logs COMMENT = 'Log de atividades do sistema';

DELIMITER //
CREATE TRIGGER signatures_before_insert
BEFORE INSERT ON signatures
FOR EACH ROW
BEGIN
    SET NEW.name = TRIM(NEW.name);

    IF NEW.email IS NOT NULL THEN
        SET NEW.email = TRIM(LOWER(NEW.email));
    END IF;
    IF CHAR_LENGTH(NEW.name) < 3 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nome deve ter pelo menos 3 caracteres';
    END IF;

    -- Validar formato do email se fornecido (usando REGEXP do MariaDB)
    IF NEW.email IS NOT NULL AND NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Formato de email inválido';
    END IF;
END //
DELIMITER ;

-- Exemplos:

-- Total de assinaturas
-- SELECT get_total_signature_count();

-- Assinaturas por dia (últimos 30 dias)
-- CALL get_signature_statistics(30);

-- Estatísticas gerais
-- SELECT * FROM signature_stats LIMIT 10;

-- Buscar assinaturas duplicadas
-- SELECT name, email, COUNT(*) as count
-- FROM signatures
-- GROUP BY LOWER(name), LOWER(email)
-- HAVING count > 1;

-- Limpar logs antigos (mais de 90 dias)
-- DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);