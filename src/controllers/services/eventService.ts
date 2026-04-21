import { Event, IEvent } from "../../models/Event.js";

export const createNewEvent = async (
  eventData: Partial<IEvent>,
  organizerId: string,
) => {
  if (eventData.eventFormat === "online" && eventData.location) {
    delete eventData.location;
  }

  // 2. Create the Main Event (The Parent)
  const mainEvent = await Event.create({
    ...eventData,
    organizer: organizerId,
  });

  // 3. Handle Recurrence Generation (Optional but Recommended)
  if (mainEvent.isRecurring && mainEvent.recurrence?.frequency !== "none") {
    // You would typically call a helper function here like:
    // await generateEventInstances(mainEvent);
    // This helper would loop through the dates and run Event.create()
    // for each date, setting parentId: mainEvent._id
  }

  return mainEvent;
};

export const generateEventInstances = async (parentEvent: IEvent) => {
  // 1. Destructure with default values to prevent 'undefined' errors
  const {
    frequency = "none",
    interval = 1,
    endDate,
    daysOfWeek = [],
  } = parentEvent.recurrence || {};

  // 2. Guard clause
  if (frequency === "none") return;

  const instances = [];

  // 3. Set a safety limit (3 months default)
  const stopDate = endDate ? new Date(endDate) : new Date();
  if (!endDate) stopDate.setMonth(stopDate.getMonth() + 3);

  let currentStartDate = new Date(parentEvent.startDate);
  const duration =
    new Date(parentEvent.endDate).getTime() - currentStartDate.getTime();

  // 4. Generation Loop
  while (true) {
    if (frequency === "daily") {
      currentStartDate.setDate(currentStartDate.getDate() + interval);
    } else if (frequency === "weekly") {
      currentStartDate.setDate(currentStartDate.getDate() + 7 * interval);
    } else if (frequency === "monthly") {
      currentStartDate.setMonth(currentStartDate.getMonth() + interval);
    }

    if (currentStartDate > stopDate) break;

    // Day of week check for weekly events
    if (frequency === "weekly" && daysOfWeek.length > 0) {
      if (!daysOfWeek.includes(currentStartDate.getDay())) continue;
    }

    // Clone the parent but strip unique DB fields
    const instanceData = parentEvent.toObject();
    delete instanceData._id;
    delete instanceData.id; // Sometimes present in toObject
    delete instanceData.createdAt;
    delete instanceData.updatedAt;

    const newStart = new Date(currentStartDate);
    const newEnd = new Date(newStart.getTime() + duration);

    instances.push({
      ...instanceData,
      startDate: newStart,
      endDate: newEnd,
      attendees: 0,
      participantImages: [],
      // Ensure the child knows it's a child
      recurrence: {
        ...parentEvent.recurrence,
        parentId: parentEvent._id,
      },
    });

    if (instances.length >= 100) break;
  }

  if (instances.length > 0) {
    await Event.insertMany(instances);
  }
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
