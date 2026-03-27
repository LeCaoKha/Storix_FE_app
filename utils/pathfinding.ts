import { NavigationEdge, NavigationNode, PathResult } from '@/types/warehouse';

/**
 * Thuật toán Dijkstra để tìm đường đi ngắn nhất giữa 2 nodes
 */
export const findShortestPath = (
  nodes: NavigationNode[],
  edges: NavigationEdge[],
  startNodeId: string,
  endNodeId: string
): PathResult | null => {
  if (!nodes || !edges || nodes.length === 0 || edges.length === 0) {
    return null;
  }

  // Build adjacency list
  const graph = new Map<string, { node: string; distance: number }[]>();
  nodes.forEach((node) => {
    graph.set(node.id, []);
  });

  edges.forEach((edge) => {
    // Add both directions (undirected graph)
    graph.get(edge.from)?.push({ node: edge.to, distance: edge.distance });
    graph.get(edge.to)?.push({ node: edge.from, distance: edge.distance });
  });

  // Dijkstra's algorithm
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  nodes.forEach((node) => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  });

  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current: string | null = null;
    let minDistance = Infinity;
    unvisited.forEach((nodeId) => {
      const dist = distances.get(nodeId) || Infinity;
      if (dist < minDistance) {
        minDistance = dist;
        current = nodeId;
      }
    });

    if (current === null || current === endNodeId) break;

    unvisited.delete(current);

    // Update distances to neighbors
    const neighbors = graph.get(current) || [];
    neighbors.forEach(({ node: neighborId, distance: edgeDistance }) => {
      if (!unvisited.has(neighborId)) return;

      const newDistance = (distances.get(current!) || 0) + edgeDistance;
      if (newDistance < (distances.get(neighborId) || Infinity)) {
        distances.set(neighborId, newDistance);
        previous.set(neighborId, current);
      }
    });
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  // Path không tồn tại
  if (path.length === 0 || path[0] !== startNodeId) {
    return null;
  }

  // Get node objects
  const pathNodes = path
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is NavigationNode => n !== undefined);

  const totalDistance = distances.get(endNodeId) || 0;

  // Generate instructions
  const instructions = generateInstructions(pathNodes);

  return {
    path: pathNodes,
    totalDistance,
    instructions,
  };
};

/**
 * Tạo hướng dẫn di chuyển từ path
 */
const generateInstructions = (path: NavigationNode[]): string[] => {
  if (path.length < 2) return ['Bạn đã ở đích'];

  const instructions: string[] = [];
  instructions.push(`Bắt đầu tại vị trí (${path[0].x}, ${path[0].y})`);

  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    const distance = Math.sqrt(
      Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
    ).toFixed(1);

    const direction = getDirection(from, to);
    instructions.push(`${i}. Đi ${direction} ${distance}m đến (${to.x}, ${to.y})`);
  }

  instructions.push(`Đã đến đích tại (${path[path.length - 1].x}, ${path[path.length - 1].y})`);

  return instructions;
};

/**
 * Xác định hướng di chuyển
 */
const getDirection = (from: NavigationNode, to: NavigationNode): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle >= -45 && angle < 45) return 'sang phải';
  if (angle >= 45 && angle < 135) return 'xuống dưới';
  if (angle >= 135 || angle < -135) return 'sang trái';
  return 'lên trên';
};

/**
 * Tìm node gần nhất với một vị trí
 */
export const findNearestNode = (
  nodes: NavigationNode[],
  x: number,
  y: number
): NavigationNode | null => {
  if (!nodes || nodes.length === 0) return null;

  let nearest: NavigationNode | null = null;
  let minDistance = Infinity;

  nodes.forEach((node) => {
    const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  });

  return nearest;
};
