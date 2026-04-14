import Hotspot from "../models/hotspotModel";

export const getAllHotspots = async (query: any) => {
  // 1. FILTERING
  const queryObj = { ...query };
  const excludedFields = ["page", "sort", "limit", "fields"];
  excludedFields.forEach((el) => delete queryObj[el]);

  const filter = { ...queryObj, isActive: true };

  // Title search
  if (filter.title) filter.title = { $regex: filter.title, $options: "i" };

  // Specific to Rivers State if not already filtered
  filter["location.state"] = "Rivers State";

  let dbQuery = Hotspot.find(filter);

  // 2. SORTING
  if (query.sort) {
    const sortBy = query.sort.split(",").join(" ");
    dbQuery = dbQuery.sort(sortBy);
  } else {
    dbQuery = dbQuery.sort("-rating"); // Show top rated first by default
  }

  // 3. PAGINATION
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  dbQuery = dbQuery.skip(skip).limit(limit);

  // 4. EXECUTE
  const hotspots = await dbQuery;
  const total = await Hotspot.countDocuments(filter);

  return { hotspots, total, page, limit };
};
