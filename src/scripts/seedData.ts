import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";
import { IUser, User } from "../models/userModel";
import { Event } from "../models/eventModel";
import { EVENT_CATEGORIES, EVENT_TYPES } from "../lib/constants";

dotenv.config();

// Configuration for Port Harcourt
const PH_NEIGHBORHOODS = [
  "Old GRA",
  "GRA Phase 2",
  "Choba",
  "Woji",
  "Rumuola",
  "D-Line",
  "Peter Odili",
  "Trans Amadi",
  "Ada George",
  "Rumuokoro",
];

const PH_BOUNDS = {
  latMin: 4.75,
  latMax: 4.9,
  lngMin: 6.95,
  lngMax: 7.1,
};

async function seedEvents() {
  try {
    // 1. Connection
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing in .env");

    await mongoose.connect(uri);
    console.log("🔌 Connected to MongoDB...");

    // 2. Clear Collections (Preserving Admin)
    await Event.deleteMany({});

    const adminEmail = "admin@gmail.com";
    const userDeleteResult = await User.deleteMany({
      email: { $ne: adminEmail },
    });

    console.log(
      `🧹 Cleanup: Removed all events and ${userDeleteResult.deletedCount} non-admin users.`,
    );

    // 3. Ensure Admin & Generate Organizers
    const categoryKeys = Object.keys(EVENT_CATEGORIES);
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log("🛡️ Creating fresh admin...");
      admin = await User.create({
        name: "Kivo Admin",
        email: adminEmail,
        password: "password1",
        role: "admin",
        active: true,
        location: {
          city: "Port Harcourt",
          neighborhood: "GRA Phase 2",
        },
      });
    }

    const organizers: IUser[] = [];
    console.log("👤 Generating 10 new organizers...");

    for (let i = 0; i < 10; i++) {
      const newUser = await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: "password123",
        role: "organizer",
        interests: faker.helpers.arrayElements(categoryKeys, 3),
        location: {
          city: "Port Harcourt",
          neighborhood: faker.helpers.arrayElement(PH_NEIGHBORHOODS),
        },
        active: true,
      });
      organizers.push(newUser);
    }

    // 4. Create 100 Balanced Events
    const typeKeys = Object.keys(EVENT_TYPES);
    const eventStatuses = ["casual", "verified", "featured"];
    const now = new Date();

    console.log("🎡 Generating 100 events with stable 7-day timelines...");

    const eventBatch = Array.from({ length: 100 }).map((_, i) => {
      const host = faker.helpers.arrayElement(organizers);
      const isFree = faker.datatype.boolean();

      let startDate: Date;
      let endDate: Date;

      /**
       * STABLE TIMELINE LOGIC
       * i % 3 == 0 -> Past
       * i % 3 == 1 -> Ongoing (Happening Now)
       * i % 3 == 2 -> Upcoming
       */
      const timelineType = i % 3;

      if (timelineType === 0) {
        // PAST: Ended at least 2 days ago
        endDate = faker.date.recent({
          days: 7,
          refDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        });
        startDate = new Date(endDate);
        startDate.setHours(endDate.getHours() - 5);
      } else if (timelineType === 1) {
        // ONGOING: Started 2 days ago, ends in 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 2);
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 7);
      } else {
        // UPCOMING: Starts in 8 days, ends in 10 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() + 8);
        startDate.setHours(18, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 2);
      }

      return {
        title: faker.company.catchPhrase().substring(0, 100),
        description: faker.lorem.paragraphs(2),
        type: faker.helpers.arrayElement(typeKeys),
        status: faker.helpers.arrayElement(eventStatuses),
        category: faker.helpers.arrayElement(categoryKeys),
        isPublic: true,
        allowAnonymous: faker.datatype.boolean(),
        startDate,
        endDate,
        location: {
          type: "Point",
          coordinates: [
            faker.location.longitude({
              min: PH_BOUNDS.lngMin,
              max: PH_BOUNDS.lngMax,
            }),
            faker.location.latitude({
              min: PH_BOUNDS.latMin,
              max: PH_BOUNDS.latMax,
            }),
          ],
          address: faker.location.streetAddress(),
          neighborhood: faker.helpers.arrayElement(PH_NEIGHBORHOODS),
        },
        image: `https://picsum.photos/seed/${faker.string.uuid()}/1200/800`,
        isFree,
        price: isFree ? 0 : faker.number.int({ min: 1000, max: 25000 }),
        attendees: faker.number.int({ min: 5, max: 200 }),
        participantImages: Array.from({ length: 4 }).map(() =>
          faker.image.avatar(),
        ),
        organizer: host._id,
        organizerType: faker.helpers.arrayElement(["individual", "business"]),
        capacity: faker.helpers.arrayElement([null, 30, 50, 100, 500]),
        isCancelled: false,
      };
    });

    // 5. Insert and Exit
    await Event.insertMany(eventBatch);
    console.log("🚀 Success! 100 stable events seeded for Port Harcourt.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedEvents();
