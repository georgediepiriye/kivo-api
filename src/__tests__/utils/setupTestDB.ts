import mongoose from "mongoose";
import config from "../../config/config.js";
import { jest } from "@jest/globals";
import selectDB from "../../database/config/config.js";

const setupTestDB = () => {
  // 1. Establish connection before all tests in the file
  beforeAll(async () => {
    // Safety Check: selectDB prevents hitting Production/Cloud Atlas
    const database = selectDB(config.env as any);
    await mongoose.connect(database.url);
  });

  // 2. Clear data before each individual test
  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(
      Object.values(collections).map((collection) => collection.deleteMany({})),
    );
  });

  // 3. Clean up after all tests are done
  afterAll(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Graceful Disconnect
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    await mongoose.disconnect();
  });
};

export default setupTestDB;
