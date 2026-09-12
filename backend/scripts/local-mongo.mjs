// A local MongoDB for development, so the app runs without installing one.
// Data is kept in backend/.mongo-data and survives restarts — this is a real
// mongod, just one that downloads itself and needs no admin rights.
import { createServer } from "node:net";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 27017;
const dbPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".mongo-data");

const portIsFree = () =>
  new Promise((done) => {
    const probe = createServer()
      .once("error", () => done(false))
      .once("listening", () => probe.close(() => done(true)))
      .listen(PORT, "127.0.0.1");
  });

if (!(await portIsFree())) {
  console.log(`Something already answers on ${PORT}; using that database.`);
  // Deliberately not exiting: the dev runner would take the API and the web
  // app down with it. Idle instead and let them run.
  setInterval(() => {}, 1 << 30);
} else {
  mkdirSync(dbPath, { recursive: true });

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create({
    instance: { port: PORT, dbPath, storageEngine: "wiredTiger" },
  });

  console.log(`MongoDB on ${mongod.getUri()} (data in backend/.mongo-data)`);

  const shutDown = async () => {
    // doCleanup: false, or every restart would start an empty database.
    await mongod.stop({ doCleanup: false, force: false });
    process.exit(0);
  };

  process.on("SIGINT", shutDown);
  process.on("SIGTERM", shutDown);
}
