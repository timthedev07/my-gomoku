import { DIM, Point } from "@/logic/board";

export const distance = (p1: [number, number], p2: [number, number]) => {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
};

export const isPointInBounds = (point: Point) => {
  return point[0] >= 0 && point[0] < DIM && point[1] >= 0 && point[1] < DIM;
};
