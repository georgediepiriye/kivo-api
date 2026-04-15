import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";
import { IUser, User } from "../models/userModel";
import { Event } from "../models/eventModel";
import { EVENT_CATEGORIES, EVENT_TYPES } from "../lib/constants";

dotenv.config();

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

const PH_BOUNDS = { latMin: 4.75, latMax: 4.9, lngMin: 6.95, lngMax: 7.1 };

async function seedEvents() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI missing");
    await mongoose.connect(uri);

    await Event.deleteMany({});
    const organizers = await User.find({
      role: { $in: ["organizer", "admin"] },
    }).limit(10);

    const categoryKeys = Object.keys(EVENT_CATEGORIES);
    const typeKeys = Object.keys(EVENT_TYPES);

    console.log("🎲 Generating 100 hyper-randomized events...");

    const eventBatch = Array.from({ length: 100 }).map((_, i) => {
      const host = faker.helpers.arrayElement(organizers);

      // 1. Randomize Financials
      const isFree = faker.datatype.boolean();
      const hasExternalLink =
        faker.helpers.maybe(() => true, { probability: 0.2 }) || false;

      // 2. Generate Random Ticket Tiers (Only if Paid & No External Link)
      const ticketTiers = [];
      if (!isFree && !hasExternalLink) {
        const tierCount = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < tierCount; j++) {
          ticketTiers.push({
            name: faker.helpers.arrayElement([
              "Early Bird",
              "Regular",
              "VIP",
              "Table",
            ]),
            price: faker.number.int({ min: 1000, max: 50000 }),
            capacity: faker.number.int({ min: 10, max: 100 }),
            sold: faker.number.int({ min: 0, max: 5 }),
            description: faker.helpers.maybe(() => faker.lorem.sentence(), {
              probability: 0.5,
            }),
          });
        }
      }

      // 3. Calculate Total Capacity from tiers or random default
      const totalCapacity =
        ticketTiers.length > 0
          ? ticketTiers.reduce((acc, t) => acc + t.capacity, 0)
          : faker.helpers.arrayElement([null, 50, 100, 200]);

      // 4. Stable randomized timelines (Past, Live, Upcoming)
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      const timeline = i % 3;

      if (timeline === 0) {
        // Past
        startDate = faker.date.past({ refDate: now });
        endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 4); // +4 hours
      } else if (timeline === 1) {
        // Live
        startDate = new Date(now.getTime() - 1000 * 60 * 60 * 2); // Started 2h ago
        endDate = new Date(now.getTime() + 1000 * 60 * 60 * 5); // Ends in 5h
      } else {
        // Upcoming
        startDate = faker.date.soon({ days: 14, refDate: now });
        endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 3); // +3 hours
      }

      return {
        title: faker.company.catchPhrase().substring(0, 100),
        description: faker.lorem.paragraphs(2),
        category: faker.helpers.arrayElement(categoryKeys),
        type: faker.helpers.arrayElement(typeKeys),
        status: faker.helpers.arrayElement(["casual", "verified", "featured"]),

        startDate,
        endDate,

        // GeoJSON Structure
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
        organizer: host._id,
        organizerType: faker.helpers.arrayElement(["individual", "business"]),

        // Privacy
        isPublic: true,
        allowAnonymous: faker.datatype.boolean(),

        // Financials
        isFree,
        ticketTiers,
        totalCapacity,
        externalTicketLink: hasExternalLink ? faker.internet.url() : undefined,

        // Engagement
        attendees: faker.number.int({ min: 0, max: 30 }),
        participantImages: Array.from({ length: 5 }).map(() =>
          faker.image.avatar(),
        ),

        // Rules & Admin
        ageRestriction: faker.helpers.arrayElement(["All Ages", "18+", "21+"]),
        refundPolicy: faker.helpers.arrayElement(["none", "flexible", "24h"]),
        tags: faker.helpers.arrayElements(
          ["live music", "networking", "party", "outdoor", "tech"],
          3,
        ),
        isCancelled:
          faker.helpers.maybe(() => true, { probability: 0.05 }) || false, // 5% chance of being cancelled
      };
    });

    await Event.insertMany(eventBatch);
    console.log("🚀 Seeding Complete: 100 randomized events inserted.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedEvents();
