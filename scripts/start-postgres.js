const net = require("net");
const fs = require("fs");
const path = require("path");
const { PGlite } = require("@electric-sql/pglite");
const { fromNodeSocket } = require("pg-gateway/node");
const { createVirtualServer } = require("pg-gateway");

const dataDir = path.join(__dirname, "..", ".data");
const pgDir = path.join(dataDir, "postgres");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const pg = new PGlite(pgDir);

const server = net.createServer(async (socket) => {
  try {
    await fromNodeSocket(socket, {
      server: createVirtualServer(async (query, { params }) => {
        try {
          const result = await pg.query(query, params);
          return {
            rows: result.rows,
            fields: result.fields,
            rowCount: result.rows ? result.rows.length : 0,
          };
        } catch (err) {
          console.error("SQL query error:", err);
          throw err;
        }
      }),
    });
  } catch (socketErr) {
    // Client disconnected
  }
});

const PORT = 5432;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Nutri-Track PostgreSQL Server running at postgresql://postgres:postgres@127.0.0.1:${PORT}/nutritrack`);
});
