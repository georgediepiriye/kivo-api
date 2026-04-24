import { Event, IEvent } from "../../models/Event.js";
import logger from "../../utils/logger.js"; // Import your winston logger

export const createNewEvent = async (
  eventData: Partial<IEvent>,
  organizerId: string,
) => {
  if (eventData.eventFormat === "online" && eventData.location) {
    delete eventData.location;
  }

  // AUDIT LOG: Identify who is broadcasting what
  logger.info(
    `Event Broadcast Initiated: Title="${eventData.title}" OrganizerID=${organizerId}`,
  );

  const mainEvent = await Event.create({
    ...eventData,
    organizer: organizerId,
  });

  logger.info(
    `Main Event Created: ID=${mainEvent._id} Recurring=${mainEvent.isRecurring}`,
  );

  if (mainEvent.isRecurring && mainEvent.recurrence?.frequency !== "none") {
    // Generate instances asynchronously or via helper
    await generateEventInstances(mainEvent);
  }

  return mainEvent;
};

export const generateEventInstances = async (parentEvent: IEvent) => {
  const {
    frequency = "none",
    interval = 1,
    endDate,
    daysOfWeek = [],
  } = parentEvent.recurrence || {};

  if (frequency === "none") return;

  logger.info(
    `Recurrence Generation Started: ParentID=${parentEvent._id} Frequency=${frequency}`,
  );

  const instances = [];
  const stopDate = endDate ? new Date(endDate) : new Date();
  if (!endDate) stopDate.setMonth(stopDate.getMonth() + 3);

  let currentStartDate = new Date(parentEvent.startDate);
  const duration =
    new Date(parentEvent.endDate).getTime() - currentStartDate.getTime();

  while (true) {
    if (frequency === "daily") {
      currentStartDate.setDate(currentStartDate.getDate() + interval);
    } else if (frequency === "weekly") {
      currentStartDate.setDate(currentStartDate.getDate() + 7 * interval);
    } else if (frequency === "monthly") {
      currentStartDate.setMonth(currentStartDate.getMonth() + interval);
    }

    if (currentStartDate > stopDate) break;

    if (frequency === "weekly" && daysOfWeek.length > 0) {
      if (!daysOfWeek.includes(currentStartDate.getDay())) continue;
    }

    const instanceData = parentEvent.toObject();
    delete instanceData._id;
    delete instanceData.id;
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
      recurrence: {
        ...parentEvent.recurrence,
        parentId: parentEvent._id,
      },
    });

    if (instances.length >= 100) {
      logger.warn(
        `Recurrence generation hit safety limit (100) for ParentID=${parentEvent._id}`,
      );
      break;
    }
  }

  if (instances.length > 0) {
    await Event.insertMany(instances);
    logger.info(
      `Recurrence Generation Complete: Created ${instances.length} instances for ParentID=${parentEvent._id}`,
    );
  }
};

export const getAllEvents = async (query: any) => {
  const queryObj = { ...query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  const filter = JSON.parse(JSON.stringify(queryObj));

  if (filter.title) filter.title = { $regex: filter.title, $options: "i" };
  filter.endDate = { $gte: new Date() };

  // PERFORMANCE LOG: Check how heavy the filters are
  logger.debug(`Fetching Events with filter: ${JSON.stringify(filter)}`);

  let dbQuery = Event.find(filter).populate({
    path: "organizer",
    select: "name image location",
  });

  if (query.sort) {
    const sortBy = query.sort.split(",").join(" ");
    dbQuery = dbQuery.sort(sortBy);
  } else {
    dbQuery = dbQuery.sort("-createdAt");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  dbQuery = dbQuery.skip(skip).limit(limit);

  const events = await dbQuery;
  const total = await Event.countDocuments(filter);

  return { events, total, page, limit };
};

export const findNearbyEvents = async (
  lng: number,
  lat: number,
  distanceInKm: number,
) => {
  // SYSTEM LOG: Geospatial queries are resource intensive
  logger.info(`GeoSearch: Lng=${lng}, Lat=${lat}, Radius=${distanceInKm}km`);

  const radius = distanceInKm / 6378.1;

  try {
    const events = await Event.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        },
      },
    });
    logger.info(`GeoSearch Success: Found ${events.length} nearby events`);
    return events;
  } catch (error: any) {
    logger.error(`GeoSearch Failed: ${error.message}`);
    throw error;
  }
};

export const getEventById = async (id: string) => {
  const event = await Event.findById(id).populate({
    path: "organizer",
    select: "name image",
  });

  if (!event) {
    logger.warn(`Event lookup failed: ID ${id} not found`);
  }

  return event;
};
