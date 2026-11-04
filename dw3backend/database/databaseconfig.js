const { Pool, types } = require("pg");

types.setTypeParser(20, (valor) => parseInt(valor, 10));
types.setTypeParser(1082, (valor) => valor);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
