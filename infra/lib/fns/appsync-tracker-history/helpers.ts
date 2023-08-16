import { Span } from "./types";

const getStartAndEndTime = (span: Span) => {
  if (span === "hour") {
    return {
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      endTime: new Date(),
    };
  } else if (span === "day") {
    return {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(),
    };
  } else if (span === "week") {
    return {
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(),
    };
  } else {
    throw new Error("Invalid span");
  }
};

export { getStartAndEndTime };
