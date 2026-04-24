import { jest } from "@jest/globals";
import * as eventService from "../../../controllers/services/eventService.js";
import { Event } from "../../../models/Event.js";

describe("Event Service Unit Tests", () => {
  const insertManySpy = jest.spyOn(Event, "insertMany");

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generateEventInstances", () => {
    it("should generate correct number of daily instances", async () => {
      // Mock parent event
      const parentEvent = {
        _id: "parent_123",
        startDate: new Date("2026-05-01T10:00:00Z"),
        endDate: new Date("2026-05-01T12:00:00Z"),
        recurrence: {
          frequency: "daily",
          interval: 1,
          endDate: new Date("2026-05-05T10:00:00Z"), // 4 more days
        },
        toObject: jest.fn().mockReturnValue({ title: "Daily Run" }),
      } as any;

      insertManySpy.mockResolvedValue([] as any);

      await eventService.generateEventInstances(parentEvent);

      // It should create instances for May 2, 3, 4, 5
      expect(insertManySpy).toHaveBeenCalled();
      const createdInstances = insertManySpy.mock.calls[0][0] as any[];
      expect(createdInstances.length).toBe(4);
      expect(createdInstances[0].startDate.toISOString()).toContain(
        "2026-05-02",
      );
    });

    it("should respect the safety limit of 100 instances", async () => {
      const parentEvent = {
        _id: "infinite_123",
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        recurrence: {
          frequency: "daily",
          interval: 1,
          // No end date, logic defaults to 3 months
        },
        toObject: jest.fn().mockReturnValue({}),
      } as any;

      insertManySpy.mockResolvedValue([] as any);

      await eventService.generateEventInstances(parentEvent);

      const createdInstances = insertManySpy.mock.calls[0][0] as any[];
      expect(createdInstances.length).toBeLessThanOrEqual(100);
    });
  });
});
