// Central DB configuration. You can override everything via environment vars
// without touching this file:
//   DB_USER, DB_PASSWORD, DB_CONNECT_STRING (e.g. "localhost:1521/XEPDB1")
//   OCI_LIB_DIR (Instant Client dir) or keep the default below

module.exports = {
  user: process.env.DB_USER || "sanjayk",
  password: process.env.DB_PASSWORD || "sanjayk*1",
  // Default to XE service. oracleConnection.js will try sensible fallbacks
  // like XEPDB1 automatically if this one fails with ORA-12514.
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XE',
  externalAuth: false,
  // Path to Oracle Instant Client. You can also set env OCI_LIB_DIR.
  instantClientDir: process.env.OCI_LIB_DIR || "C:\\OracleClint\\instantclient_21_17"
};