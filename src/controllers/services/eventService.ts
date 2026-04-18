import { Event, IEvent } from "../../models/Event.js";

export const createNewEvent = async (
  eventData: Partial<IEvent>,
  organizerId: string,
) => {
  // Double-check: ensure location isn't a partial object with just a type
  if (eventData.eventFormat === "online" && eventData.location) {
    delete eventData.location;
  }

  return await Event.create({
    ...eventData,
    organizer: organizerId,
  });
};

export const getAllEvents = async (query: any) => {
  // 1. FILTERING
  const queryObj = { ...query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  const filter = JSON.parse(queryStr);

  // Handle title search regex
  if (filter.title) filter.title = { $regex: filter.title, $options: "i" };

  // EXCLUDE PAST EVENTS
  // Only return events where the endDate is in the future
  filter.endDate = { $gte: new Date() };

  let dbQuery = Event.find(filter).populate({
    path: "organizer",
    select: "name image location",
  });

  // 2. SORTING
  if (query.sort) {
    const sortBy = query.sort.split(",").join(" ");
    dbQuery = dbQuery.sort(sortBy);
  } else {
    // Default to Newest first, or use startDate to show soonest events first
    dbQuery = dbQuery.sort("-createdAt");
  }

  // 3. PAGINATION
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  dbQuery = dbQuery.skip(skip).limit(limit);

  // 4. EXECUTE
  const events = await dbQuery;
  const total = await Event.countDocuments(filter);

  return { events, total, page, limit };
};

export const findNearbyEvents = async (
  lng: number,
  lat: number,
  distanceInKm: number,
) => {
  // Earth radius in km
  const radius = distanceInKm / 6378.1;

  return await Event.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
};

export const getEventById = async (id: string) => {
  return await Event.findById(id).populate({
    path: "organizer",
    select: "name image",
  });
};
