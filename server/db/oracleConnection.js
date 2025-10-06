const oracledb = require('oracledb');
const dbConfig = require('../config/dbConfig');

// Set the oracledb module's Instant Client directory
if (dbConfig.instantClientDir) {
  try {
    oracledb.initOracleClient({ libDir: dbConfig.instantClientDir });
    console.log("Oracle Instant Client initialized successfully");
  } catch (err) {
    console.error("Failed to initialize Oracle Instant Client:", err);
    process.exit(1);
  }
}

// Configure oracledb module
oracledb.autoCommit = true;
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let poolInitialized = false;

// Build a set of plausible connect strings. ORA-12514 usually means the
// service name is wrong (XE vs XEPDB1). We try a few common variants.
function getConnectStringCandidates() {
  const primary = dbConfig.connectString || '';
  const [hostPort, svcFromPrimary] = primary.includes('/') ? primary.split('/') : [primary, ''];
  const hostCandidates = [hostPort || 'localhost:1521', '127.0.0.1:1521', 'localhost'];
  const serviceCandidates = [];
  if (svcFromPrimary) serviceCandidates.push(svcFromPrimary);
  serviceCandidates.push('XEPDB1', 'XE');

  const candidates = new Set();
  if (primary) candidates.add(primary);
  for (const hp of hostCandidates) {
    for (const svc of serviceCandidates) {
      if (!svc) continue;
      const cs = hp.includes('/') ? hp : `${hp}/${svc}`;
      candidates.add(cs);
    }
  }
  return Array.from(candidates);
}

async function createPoolWithFallback() {
  const candidates = getConnectStringCandidates();
  let lastErr;
  for (const connectString of candidates) {
    try {
      await oracledb.createPool({
        user: dbConfig.user,
        password: dbConfig.password,
        connectString,
        poolIncrement: 1,
        poolMax: 10,
        poolMin: 1
      });
      console.log(`Connection pool created successfully (connectString=${connectString})`);
      return;
    } catch (err) {
      lastErr = err;
      if (err && err.code === 'ORA-12514') {
        console.warn(`Listener does not know service for ${connectString}. Trying next...`);
        continue;
      }
      console.error('Error creating connection pool:', err);
      throw err;
    }
  }
  throw lastErr || new Error('Failed to create Oracle pool using all candidates');
}

async function initialize() {
  try {
    // Create a default connection pool (with service-name fallbacks)
    await createPoolWithFallback();
    
    poolInitialized = true;
  } catch (err) {
    console.error('Error creating connection pool:', err);
    throw err;
  }
}

async function closePool() {
  try {
    if (poolInitialized) {
      await oracledb.getPool().close(10);
      poolInitialized = false;
      console.log('Connection pool closed');
    }
  } catch (err) {
    console.error('Error closing connection pool:', err);
  }
}

async function execute(sql, binds = [], options = {}) {
  let connection;
  try {
    // Ensure pool is initialized
    if (!poolInitialized) {
      await initialize();
    }
    
    // Get a connection from the pool
    connection = await oracledb.getPool().getConnection();
    
    // Execute the SQL statement
    const result = await connection.execute(sql, binds, options);
    
    return result;
  } catch (err) {
    console.error('Error executing SQL:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        // Release the connection back to the pool
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

async function executeStoredProcedure(procedureName, bindParams) {
  let connection;
  try {
    // Ensure pool is initialized
    if (!poolInitialized) {
      await initialize();
    }
    
    // Get a connection from the pool
    connection = await oracledb.getPool().getConnection();
    
    // Execute the stored procedure
    return await connection.execute(
      `BEGIN ${procedureName}; END;`,
      bindParams
    );
  } catch (err) {
    console.error(`Error executing stored procedure ${procedureName}:`, err);
    throw err;
  } finally {
    if (connection) {
      try {
        // Release the connection back to the pool
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

module.exports = {
  initialize,
  closePool,
  execute,
  executeStoredProcedure
};