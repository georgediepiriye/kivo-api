import { Request, Response, NextFunction } from "express";
import * as hotspotService from "../services/hotspotService";
import httpStatus from "http-status";

export const getAllHotspots = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { hotspots, total, page, limit } =
      await hotspotService.getAllHotspots(req.query);

    const response = {
      status: "success",
      results: hotspots.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: { hotspots },
    };

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
};
