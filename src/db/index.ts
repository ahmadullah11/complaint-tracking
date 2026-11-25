import mongoose from "mongoose";
import { requireMongoConnectionEnv } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

// Reuse the connection across invocations of the same serverless function
// instance. Vercel may run many instances, but each one keeps a small pool.
const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB() {
  const readyState = mongoose.connection.readyState;

  // 1 = connected. Reuse it.
  if (cached.conn && readyState === 1) {
    return cached.conn;
  }

  // 0 = disconnected. Throw away both the old connection and its promise so the
  // next call really reconnects instead of awaiting an already-resolved promise.
  if (readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  } else if (readyState !== 1) {
    // Connecting/disconnecting: keep the in-flight promise and await it below.
    cached.conn = null;
  }

  const { uri, variable } = requireMongoConnectionEnv();

  if (!cached.promise) {
    console.info(`[db] Connecting to MongoDB using ${variable}.`);

    cached.promise = mongoose
      .connect(uri, {
        // Serverless-safe pool settings: no long-lived idle sockets, fail fast
        // instead of buffering queries when the database is unreachable.
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 30_000,
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        retryWrites: true,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
    console.info(`[db] MongoDB connected (readyState=${mongoose.connection.readyState}).`);
  } catch (err) {
    // Never keep a rejected promise: the next request should retry the
    // connection instead of instantly failing with the old error.
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
