export const distance = (p1: [number, number], p2: [number, number]) => {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
};

