require("reflect-metadata");
const { DataSource } = require("typeorm");
const { Signature } = require("../entities/Signature.js");

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "faca_a_lista_manifesto",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development",
    entities: [Signature],
    migrations: [],
    subscribers: [],
});

module.exports = { AppDataSource };