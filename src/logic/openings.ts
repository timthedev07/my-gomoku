import { Point } from "./board";

// hard code openings
export class OpeningNode {
  move: Point;
  children: OpeningNode[];

  constructor(move: Point, children: OpeningNode[] = []) {
    this.move = move;
    this.children = children;
  }

  getMove() {
    return this.move;
  }

  getChildren() {
    return this.children;
  }

  setMove(move: Point) {
    this.move = move;
  }

  setChildren(children: OpeningNode[]) {
    this.children = children;
  }
}

// root is untouched
const generateSymmetricOpenings = (tree: OpeningNode): OpeningNode => {
  const all: OpeningNode[] = [];

  const rotate = (point: Point, angleDeg: number): Point => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const [x, y] = point;
    const [c, s] = [Math.cos(angleRad), Math.sin(angleRad)].map(Math.round);

    return [
      7 + (x - 7) * c - (y - 7) * s,
      7 + (x - 7) * s + (y - 7) * c,
    ] as Point;
  };

  const traverse = (
    node: OpeningNode,
    operation: (_: Point) => Point,
    modifyRoot = false
  ): OpeningNode => {
    if (modifyRoot) {
      node.move = operation(node.move);
    }

    node.children = node.children.map((child) =>
      traverse(child, operation, true)
    );

    return node;
  };

  // four rotational symmetries
  for (const angle of [0, 90, 180, 270]) {
    all.concat(traverse(tree, (p) => rotate(p, angle)).getChildren());
  }

  // flip along each of the 8 mirror symmetries
  for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
    all.concat(
      traverse(
        tree,
        (p) => rotate(rotate(p, angle), -angle + 180),
        true
      ).getChildren()
    );
  }

  tree.setChildren(all);
  return tree;
};

export const hardcodedOpenings = new OpeningNode(
  [7, 7],
  [new OpeningNode([6, 8], []), new OpeningNode([6, 7], [])]
);
