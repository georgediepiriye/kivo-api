/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";
import { User } from "../models/userModel";
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

const TIER_TEMPLATES = [
  ["Regular", "VIP", "VVIP"],
  ["Early Bird", "Standard"],
  ["Single Entry", "Couple's Pass", "Group of 5"],
  ["Student", "Professional", "Executive"],
  ["General Admission", "Backstage Access"],
];

async function seedEvents() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI missing");
    await mongoose.connect(uri);

    console.log("🧹 Clearing existing events...");
    await Event.deleteMany({});

    const organizers = await User.find({
      role: { $in: ["organizer", "admin"] },
    }).limit(10);

    if (organizers.length === 0) {
      console.log("⚠️ No organizers found. Please seed users first.");
      process.exit(1);
    }

    const categoryKeys = Object.keys(EVENT_CATEGORIES);
    const typeKeys = Object.keys(EVENT_TYPES);

    console.log("🎲 Generating 100 timeline-distributed events...");

    const eventBatch = Array.from({ length: 100 }).map((_, i) => {
      const host = faker.helpers.arrayElement(organizers);
      const eventFormat = faker.helpers.arrayElement([
        "physical",
        "online",
        "hybrid",
      ]);
      const isOnline = eventFormat === "online" || eventFormat === "hybrid";

      // --- 1. UPDATED DATE LOGIC (1 Week Spans) ---
      const now = new Date();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const ONE_WEEK = 7 * ONE_DAY;

      let startDate: Date;
      let endDate: Date;
      const roll = Math.random();

      if (roll < 0.2) {
        // PAST: Between 3 weeks and 2 weeks ago
        startDate = faker.date.between({
          from: new Date(now.getTime() - 21 * ONE_DAY),
          to: new Date(now.getTime() - 14 * ONE_DAY),
        });
        endDate = new Date(startDate.getTime() + ONE_WEEK);
      } else if (roll < 0.5) {
        // LIVE/ONGOING: Started 3 days ago, ends 4 days from now (Full 7 Days)
        startDate = new Date(now.getTime() - 3 * ONE_DAY);
        endDate = new Date(now.getTime() + 4 * ONE_DAY);
      } else {
        // UPCOMING: Starts at least 7 days from now, lasts for 1 week
        const oneWeekFromNow = new Date(now.getTime() + ONE_WEEK);
        startDate = faker.date.soon({ days: 14, refDate: oneWeekFromNow });
        endDate = new Date(startDate.getTime() + ONE_WEEK);
      }

      // --- 2. INITIALIZE EVENT OBJECT ---
      const eventData: Record<string, any> = {
        title: `${faker.commerce.productAdjective()} ${faker.helpers.arrayElement(["Summit", "Party", "Festival", "Workshop", "Hangout"])}`,
        description: faker.commerce.productDescription(),
        category: faker.helpers.arrayElement(categoryKeys),
        type: faker.helpers.arrayElement(typeKeys),
        status: faker.helpers.arrayElement(["casual", "verified", "featured"]),
        medium: eventFormat, // Using 'medium' as seen in your UI logic
        eventFormat,
        isOnline,
        startDate,
        endDate,
        image: `https://picsum.photos/seed/${faker.string.uuid()}/1200/800`,
        organizer: host?._id,
        organizerType: faker.helpers.arrayElement(["individual", "business"]),
        isPublic: true,
        allowAnonymous: faker.datatype.boolean(),
        attendees: faker.number.int({ min: 5, max: 50 }),
        participantImages: Array.from({ length: 5 }).map(() =>
          faker.image.avatar(),
        ),
        ageRestriction: faker.helpers.arrayElement(["All Ages", "18+", "21+"]),
        refundPolicy: faker.helpers.arrayElement(["none", "flexible", "24h"]),
        tags: faker.helpers.arrayElements(
          ["live music", "networking", "party", "tech", "web3", "creative"],
          3,
        ),
        isCancelled:
          faker.helpers.maybe(() => true, { probability: 0.05 }) || false,
        ticketTiers: [],
        isFree: true,
      };

      // --- 3. TICKETING LOGIC ---
      const ticketingType = faker.helpers.arrayElement([
        "none",
        "internal",
        "external",
      ]);
      eventData.ticketingType = ticketingType;

      if (ticketingType === "internal") {
        eventData.isFree =
          faker.helpers.maybe(() => false, { probability: 0.7 }) || false;
        if (!eventData.isFree) {
          const template = faker.helpers.arrayElement(TIER_TEMPLATES);
          const basePrice = faker.number.int({ min: 2000, max: 10000 });
          eventData.ticketTiers = template.map((tierName, index) => ({
            name: tierName,
            price: basePrice * (index + 1),
            capacity: 100,
            sold: faker.number.int({ min: 0, max: 10 }),
            description: `Standard access for ${tierName}.`,
          }));
        } else {
          eventData.ticketTiers = [
            {
              name: "General Admission",
              price: 0,
              capacity: 200,
              sold: 15,
              description: "Free entry.",
            },
          ];
        }
      } else if (ticketingType === "external") {
        eventData.isFree = false;
        eventData.externalTicketLink = faker.internet.url();
      } else {
        // Community/WhatsApp Events
        eventData.joinLink = `https://chat.whatsapp.com/${faker.string.alphanumeric(20)}`;
      }

      // --- 4. VIRTUAL / PHYSICAL LOGIC ---
      if (isOnline) {
        eventData.meetingLink = faker.helpers.arrayElement([
          `https://zoom.us/j/${faker.number.int({ min: 111111, max: 999999 })}`,
          `https://meet.google.com/abc-defg-hij`,
        ]);
      }

      // Even hybrid/online events benefit from a location seed for the "Map"
      // but the UI will handle the 'Online' badge based on eventFormat/isOnline
      eventData.location = {
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
        neighborhood: PH_NEIGHBORHOODS[i % 10],
      };

      return eventData;
    });

    await Event.create(eventBatch);
    console.log("🚀 Kivo DB Seeded Successfully with long-running Live moves!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedEvents();
