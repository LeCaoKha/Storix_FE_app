import { Shelf, WarehouseZone, WarehouseStructure, NavigationNode } from "@/types/warehouse";

/**
 * Tính toán tọa độ tuyệt đối của kệ dựa trên zone
 */
export const resolveShelfAbsolutePosition = (shelf: Shelf, zone: WarehouseZone) => {
  const shelfLength = shelf.length ?? shelf.height ?? shelf.width;
  const zoneLength = zone.length ?? zone.height ?? zone.width;

  const isRelativeToZone =
    shelf.x >= -1 &&
    shelf.y >= -1 &&
    shelf.x + shelf.width <= zone.width + 1 &&
    shelf.y + shelfLength <= zoneLength + 1;

  if (isRelativeToZone) {
    return {
      x: zone.x + shelf.x,
      y: zone.y + shelf.y,
      coordinateMode: "relative" as const,
    };
  }

  return { x: shelf.x, y: shelf.y, coordinateMode: "absolute" as const };
};

/**
 * Chuẩn hóa toàn bộ cấu trúc kho, chuyển đổi tọa độ các node từ tương đối sang tuyệt đối
 */
export const normalizeWarehouseStructure = (structure: WarehouseStructure): WarehouseStructure => {
  if (!structure.zones || !structure.nodes) return structure;

  // Bản đồ lưu trữ độ lệch (offset) cho từng node ID
  const nodeOffsets = new Map<string, { x: number; y: number }>();

  structure.zones.forEach((zone) => {
    (zone.shelves ?? []).forEach((shelf) => {
      (shelf.accessNodes ?? []).forEach((accessNode) => {
        // Người dùng yêu cầu bỏ X_kệ_tương_đối, tức là node chỉ tương đối so với Zone
        nodeOffsets.set(accessNode.id, { x: zone.x, y: zone.y });
      });
    });
  });

  // Cập nhật tọa độ tuyệt đối cho mảng nodes chính
  const normalizedNodes = structure.nodes.map((node) => {
    const offset = nodeOffsets.get(node.id);
    if (offset) {
      // Chỉ cộng dồn nếu tọa độ hiện tại có vẻ là tọa độ tương đối (nhỏ hơn kích thước kệ/zone)
      // Thông thường nếu nó là tương đối thì x, y sẽ nằm trong khoảng [0, width/length của kệ]
      // Ở đây ta cứ cộng dồn theo yêu cầu của user: "Tọa độ thực tế = tọa độ hiện tại [cộng thêm offset]"
      return {
        ...node,
        x: offset.x + node.x,
        y: offset.y + node.y,
      };
    }
    return node;
  });

  return {
    ...structure,
    nodes: normalizedNodes,
  };
};
