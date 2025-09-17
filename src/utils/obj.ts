import { ThreatsMap } from "@/logic/threats";

export const areThreatMapsEqual = (a: ThreatsMap, b: ThreatsMap): boolean => {
  if (a.size !== b.size) return false;

  for (const [key, threatsA] of a) {
    const threatsB = b.get(key);
    if (!threatsB) return false;

    if (threatsA.player !== threatsB.player) return false;

    const windowA = threatsA.window;
    const windowB = threatsB.window;

    if (windowA[0][0] !== windowB[0][0] || windowA[0][1] !== windowB[0][1] || windowA[1] !== windowB[1]) {
      return false;
    }
  }

  return true;
}
