// Waits for MongoDB to accept connections before the server tries to use it.
// The server deliberately connects before it listens and exits if that fails,
// so on a cold start — where the local database is still downloading — it would
// otherwise give up before the database ever appeared.
import { connect } from "node:net";

const { hostname, port } = new URL(
  (process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017").replace("mongodb://", "http://"),
);
const deadline = Date.now() + 5 * 60 * 1000;

const answers = () =>
  new Promise((done) => {
    const socket = connect({ host: hostname, port: Number(port) || 27017 })
      .once("connect", () => socket.end(() => done(true)))
      .once("error", () => done(false));
    socket.setTimeout(2000, () => socket.destroy());
  });

let announced = false;

while (!(await answers())) {
  if (Date.now() > deadline) {
    // Out of patience: let the server start and report the failure in its own
    // words rather than inventing a second way of saying the same thing.
    console.log("Gave up waiting for the database; starting anyway.");
    break;
  }

  if (!announced) {
    console.log("Waiting for the database...");
    announced = true;
  }

  await new Promise((resume) => setTimeout(resume, 1000));
}
