import mongoose from "mongoose";
import dotenv from "dotenv";
import Hotspot from "../models/hotspotModel";

dotenv.config();

const hotspots = [
  // --- NIGHTLIFE & LOUNGES ---
  {
    title: "Casablanca Sports Bar",
    category: "nightlife",
    status: "HOT",
    neighborhood: "GRA Phase 3",
    coords: [6.978, 4.811],
  },
  {
    title: "Asia Town",
    category: "lounge",
    status: "TRENDING",
    neighborhood: "Old GRA",
    coords: [7.011, 4.782],
  },
  {
    title: "Sky Bar PH",
    category: "nightlife",
    status: "TRENDING",
    neighborhood: "Genesis",
    coords: [7.002, 4.835],
  },
  {
    title: "The Hub",
    category: "lounge",
    status: "ACTIVE",
    neighborhood: "Peter Odili",
    coords: [7.0261, 4.821],
  },

  // --- DINING & CAFES ---
  {
    title: "Bole King",
    category: "dining",
    status: "HOT",
    neighborhood: "Garrison",
    coords: [6.9925, 4.8142],
  },
  {
    title: "Native Tray",
    category: "dining",
    status: "ACTIVE",
    neighborhood: "GRA",
    coords: [6.982, 4.819],
  },
  {
    title: "The Spice Route",
    category: "dining",
    status: "ACTIVE",
    neighborhood: "Mall",
    coords: [7.0045, 4.7795],
  },

  // --- WELLNESS & OUTDOORS (Replaces Park/Beach) ---
  {
    title: "PH Pleasure Park",
    category: "wellness",
    status: "TRENDING",
    neighborhood: "Rumuola",
    coords: [7.0094, 4.8239],
  },
  {
    title: "Isaac Boro Park",
    category: "wellness",
    status: "CHILL",
    neighborhood: "Mile 1",
    coords: [7.0012, 4.7891],
  },
  {
    title: "Ifoko Beach",
    category: "wellness",
    status: "CHILL",
    neighborhood: "Bakana",
    coords: [6.95, 4.7],
  },

  // --- RETAIL & COMMERCE (Replaces Market) ---
  {
    title: "Port Harcourt Mall",
    category: "retail",
    status: "ACTIVE",
    neighborhood: "Azikiwe",
    coords: [7.005, 4.7797],
  },
  {
    title: "Next Cash & Carry",
    category: "retail",
    status: "ACTIVE",
    neighborhood: "Oginigba",
    coords: [7.035, 4.832],
  },
  {
    title: "Oil Mill Market",
    category: "retail",
    status: "TRENDING",
    neighborhood: "Rumukwurusi",
    coords: [7.065, 4.855],
  },

  // --- ARTS & WORKSPACE ---
  {
    title: "Rivers State Museum",
    category: "arts",
    status: "CHILL",
    neighborhood: "Secretariat",
    coords: [7.008, 4.785],
  },
  {
    title: "Filmhouse Cinema",
    category: "arts",
    status: "ACTIVE",
    neighborhood: "GRA",
    coords: [6.981, 4.813],
  },
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is missing in .env");

    await mongoose.connect(uri);
    console.log("🔌 Connected to Kivo DB...");

    await Hotspot.deleteMany({});
    console.log("Cleared old hotspots.");

    const formattedHotspots = hotspots.map((h) => ({
      title: h.title,
      category: h.category,
      status: h.status || "CHILL",
      description: `Explore the unique vibes of ${h.title} in ${h.neighborhood}. A curated Kivo hotspot for the best ${h.category} experience in Port Harcourt.`,
      image: `https://images.unsplash.com/photo-1514525253344-9914f255399c?auto=format&fit=crop&w=800&q=60`,
      location: {
        type: "Point",
        coordinates: h.coords,
        address: `${h.neighborhood}, Port Harcourt, Rivers State`,
        neighborhood: h.neighborhood,
        city: "Port Harcourt",
        state: "Rivers State",
      },
      rating: (Math.random() * (5 - 4.0) + 4.0).toFixed(1), // Higher professional average
      bestTimeToVisit:
        h.category === "nightlife" ? "9:00 PM - 2:00 AM" : "10:00 AM - 8:00 PM",
      isActive: true,
    }));

    await Hotspot.insertMany(formattedHotspots);
    console.log(
      `✅ Successfully seeded ${formattedHotspots.length} professional hotspots!`,
    );

    process.exit();
  } catch (error) {
    console.error("❌ Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
