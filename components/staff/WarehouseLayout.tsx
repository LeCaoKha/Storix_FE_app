import { COLORS } from "@/constants/color";
import {
  NavigationNode,
  Shelf,
  WarehouseStructure,
  WarehouseZone,
} from "@/types/warehouse";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Dimensions,
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Pattern,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const PADDING = 20;
const FOOTER_HEIGHT = 72;
const SHELF_HIT_PADDING = 16;

interface WarehouseLayoutProps {
  structure: WarehouseStructure;
  highlightedShelf?: string;
  recommendedShelves?: string[];
  highlightedPath?: NavigationNode[];
  onShelfPress?: (shelf: Shelf, zone: WarehouseZone) => void;
  onZonePress?: (zone: WarehouseZone) => void;
}

export const WarehouseLayout: React.FC<WarehouseLayoutProps> = ({
  structure,
  highlightedShelf,
  recommendedShelves,
  highlightedPath,
  onShelfPress,
  onZonePress,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startScale = useSharedValue(1);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  const [showNodes, setShowNodes] = React.useState(false);
  const [viewport, setViewport] = React.useState({
    width: SCREEN_WIDTH - PADDING * 2,
    height: SCREEN_HEIGHT * 0.55,
  });

  const resolveShelfAbsolutePosition = useCallback(
    (shelf: Shelf, zone: WarehouseZone) => {
      const isRelativeToZone =
        shelf.x >= -1 &&
        shelf.y >= -1 &&
        shelf.x + shelf.width <= zone.width + 1 &&
        shelf.y + shelf.height <= zone.height + 1;

      if (isRelativeToZone) {
        return {
          x: zone.x + shelf.x,
          y: zone.y + shelf.y,
          coordinateMode: "relative" as const,
        };
      }

      return { x: shelf.x, y: shelf.y, coordinateMode: "absolute" as const };
    },
    [],
  );

  const normalizedZones = useMemo(() => {
    return (structure.zones ?? []).map((zone) => {
      const seen = new Set<string>();
      const uniqueShelves = (zone.shelves ?? []).filter((shelf) => {
        const dedupeKey = String(
          shelf.id ||
            `${shelf.code}-${shelf.x}-${shelf.y}-${shelf.width}-${shelf.height}`,
        );
        if (seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        return true;
      });

      const overlaps = (a: Shelf, b: Shelf) => {
        const aPos = resolveShelfAbsolutePosition(a, zone);
        const bPos = resolveShelfAbsolutePosition(b, zone);

        return (
          aPos.x < bPos.x + b.width &&
          aPos.x + a.width > bPos.x &&
          aPos.y < bPos.y + b.height &&
          aPos.y + a.height > bPos.y
        );
      };

      const scoreShelfQuality = (shelf: Shelf) => {
        const id = String(shelf.id ?? "");
        const numericId = /^s-\d{8,}/.test(id) ? 2 : 0;
        const structureScore =
          ((shelf.levels?.length ?? 0) > 0 ? 1 : 0) +
          ((shelf.accessNodes?.length ?? 0) > 0 ? 1 : 0);
        return numericId + structureScore;
      };

      // Collapse overlapping duplicates in the same zone when they share the same shelf code.
      const resolvedShelves: Shelf[] = [];
      uniqueShelves.forEach((candidate) => {
        const sameCodeIndex = resolvedShelves.findIndex((existing) => {
          const hasSameCode =
            String(existing.code ?? "") === String(candidate.code ?? "");
          return hasSameCode && overlaps(existing, candidate);
        });

        if (sameCodeIndex === -1) {
          resolvedShelves.push(candidate);
          return;
        }

        const existing = resolvedShelves[sameCodeIndex];
        const existingScore = scoreShelfQuality(existing);
        const candidateScore = scoreShelfQuality(candidate);

        if (candidateScore > existingScore) {
          resolvedShelves[sameCodeIndex] = candidate;
        }
      });

      return {
        ...zone,
        shelves: resolvedShelves,
      };
    });
  }, [resolveShelfAbsolutePosition, structure.zones]);

  const contentBounds = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const includeRect = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    };

    const includePoint = (x: number, y: number, r = 0) => {
      minX = Math.min(minX, x - r);
      minY = Math.min(minY, y - r);
      maxX = Math.max(maxX, x + r);
      maxY = Math.max(maxY, y + r);
    };

    normalizedZones.forEach((zone) => {
      includeRect(zone.x, zone.y, zone.width, zone.height);
      (zone.shelves ?? []).forEach((shelf) => {
        const { x, y } = resolveShelfAbsolutePosition(shelf, zone);
        includeRect(x, y, shelf.width, shelf.height);
      });
    });

    // Ignore navigation nodes that are too far outside warehouse content.
    // Outlier nodes can make the initial fit scale extremely small, causing
    // the map to look blank on first open.
    const nodeXMin = -100;
    const nodeYMin = -100;
    const nodeXMax = Math.max(structure.width + 100, 100);
    const nodeYMax = Math.max(structure.height + 100, 100);
    (structure.nodes ?? []).forEach((node) => {
      if (
        node.x < nodeXMin ||
        node.x > nodeXMax ||
        node.y < nodeYMin ||
        node.y > nodeYMax
      ) {
        return;
      }
      includePoint(node.x, node.y, node.radius ?? 2);
    });

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      minX = 0;
      minY = 0;
      maxX = structure.width;
      maxY = structure.height;
    }

    // Keep a bit of breathing space around the drawn content
    const contentPadding = 30;
    minX = minX - contentPadding;
    minY = minY - contentPadding;
    maxX = maxX + contentPadding;
    maxY = maxY + contentPadding;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
    };
  }, [
    normalizedZones,
    resolveShelfAbsolutePosition,
    structure.height,
    structure.nodes,
    structure.width,
  ]);

  const onMapLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setViewport({ width, height });
    }
  };

  // Initial fit calculation
  const calculateInitialFit = useCallback(() => {
    const availableWidth = Math.max(viewport.width - PADDING, 1);
    const availableHeight = Math.max(
      viewport.height - FOOTER_HEIGHT - PADDING,
      1,
    );

    const sX = availableWidth / contentBounds.width;
    const sY = availableHeight / contentBounds.height;
    const initialScale = Math.min(sX, sY, 4);

    const scaledWidth = contentBounds.width * initialScale;
    const scaledHeight = contentBounds.height * initialScale;

    scale.value = withSpring(initialScale);
    translateX.value = withSpring(
      (viewport.width - scaledWidth) / 2 - contentBounds.minX * initialScale,
    );
    translateY.value = withSpring(
      (availableHeight - scaledHeight) / 2 - contentBounds.minY * initialScale,
    );
  }, [
    contentBounds.height,
    contentBounds.minX,
    contentBounds.minY,
    contentBounds.width,
    scale,
    translateX,
    translateY,
    viewport.height,
    viewport.width,
  ]);

  useEffect(() => {
    calculateInitialFit();
  }, [calculateInitialFit]);

  // Gestures
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.max(0.3, Math.min(startScale.value * event.scale, 5));
    });

  const panGesture = Gesture.Pan()
    .minDistance(12)
    .onStart(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startTranslateX.value + event.translationX;
      translateY.value = startTranslateY.value + event.translationY;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      if (scale.value > 1.5) {
        runOnJS(calculateInitialFit)();
      } else {
        scale.value = withSpring(2.5);
        // Zoom into the tap position
        translateX.value = withSpring(viewport.width / 2 - event.x * 2.5);
        translateY.value = withSpring(viewport.height / 2 - event.y * 2.5);
      }
    });

  // Tap to select shelf (Hit testing)
  const composedGesture = Gesture.Simultaneous(
    Gesture.Simultaneous(pinchGesture, panGesture),
    doubleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleZoomIn = () => {
    scale.value = withTiming(Math.min(scale.value + 0.3, 5));
  };

  const handleZoomOut = () => {
    scale.value = withTiming(Math.max(scale.value - 0.3, 0.3));
  };

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
  }, [pulse]);

  useEffect(() => {
    const zones = normalizedZones;
    const shelfRects: {
      zoneId: string;
      zoneCode: string;
      shelfId: string;
      shelfCode: string;
      x: number;
      y: number;
      coordinateMode: "relative" | "absolute";
      width: number;
      height: number;
    }[] = [];

    zones.forEach((zone) => {
      (zone.shelves ?? []).forEach((shelf) => {
        shelfRects.push({
          zoneId: String(zone.id),
          zoneCode: String(zone.code ?? ""),
          shelfId: String(shelf.id),
          shelfCode: String(shelf.code ?? ""),
          ...resolveShelfAbsolutePosition(shelf, zone),
          width: shelf.width,
          height: shelf.height,
        });
      });
    });

    console.log("[WarehouseLayout] structure summary", {
      warehouseSize: { width: structure.width, height: structure.height },
      zoneCount: zones.length,
      shelfCount: shelfRects.length,
    });

    console.log(
      "[WarehouseLayout] zones",
      zones.map((zone) => ({
        id: zone.id,
        code: zone.code,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        shelfCount: (zone.shelves ?? []).length,
      })),
    );

    console.log(
      "[WarehouseLayout] shelves (absolute)",
      shelfRects.map((shelf) => ({
        zoneId: shelf.zoneId,
        zoneCode: shelf.zoneCode,
        shelfId: shelf.shelfId,
        shelfCode: shelf.shelfCode,
        x: shelf.x,
        y: shelf.y,
        coordinateMode: shelf.coordinateMode,
        width: shelf.width,
        height: shelf.height,
      })),
    );

    const overlaps: { a: string; b: string; zoneA: string; zoneB: string }[] =
      [];
    for (let i = 0; i < shelfRects.length; i++) {
      for (let j = i + 1; j < shelfRects.length; j++) {
        const a = shelfRects[i];
        const b = shelfRects[j];

        const isOverlap =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;

        if (isOverlap) {
          overlaps.push({
            a: `${a.shelfCode} (${a.shelfId}) @ [${a.x}, ${a.y}, ${a.width}, ${a.height}]`,
            b: `${b.shelfCode} (${b.shelfId}) @ [${b.x}, ${b.y}, ${b.width}, ${b.height}]`,
            zoneA: `${a.zoneCode} (${a.zoneId})`,
            zoneB: `${b.zoneCode} (${b.zoneId})`,
          });
        }
      }
    }

    if (overlaps.length > 0) {
      console.warn("[WarehouseLayout] detected shelf overlaps", overlaps);
    } else {
      console.log(
        "[WarehouseLayout] no shelf overlap detected from data rectangles",
      );
    }
  }, [
    normalizedZones,
    resolveShelfAbsolutePosition,
    structure.height,
    structure.width,
  ]);

  const renderShelf = (
    shelf: Shelf,
    zone: WarehouseZone,
    shelfIndex: number,
  ) => {
    const isHighlighted = highlightedShelf === shelf.id;
    const hasAnyRecommendations = (recommendedShelves?.length ?? 0) > 0;
    const isRecommended = (recommendedShelves ?? []).includes(shelf.id);
    const isDimmed = hasAnyRecommendations && !isRecommended && !isHighlighted;

    const gradientId = `gradient-${zone.id}-${shelf.id}-${shelfIndex}`;

    const baseColor = isHighlighted
      ? COLORS.primary
      : isRecommended
        ? COLORS.success
        : isDimmed
          ? COLORS.slate200
          : "#E2E8F0";

    const faceColor = isHighlighted
      ? COLORS.primaryLight
      : isRecommended
        ? COLORS.successLight
        : isDimmed
          ? COLORS.slate50
          : "#F8FAFC";

    const strokeColor = isHighlighted
      ? COLORS.primary
      : isRecommended
        ? COLORS.success
        : isDimmed
          ? COLORS.slate300
          : COLORS.slate400;

    const { x: absX, y: absY } = resolveShelfAbsolutePosition(shelf, zone);
    const hitX = absX - SHELF_HIT_PADDING;
    const hitY = absY - SHELF_HIT_PADDING;
    const hitWidth = shelf.width + SHELF_HIT_PADDING * 2;
    const hitHeight = shelf.height + SHELF_HIT_PADDING * 2;

    return (
      <G
        key={`shelf-${zone.id}-${shelf.id}-${shelfIndex}`}
        opacity={isDimmed ? 0.4 : 1}
      >
        {/* Expanded invisible hit area so tiny shelves are easy to tap */}
        <Rect
          x={hitX}
          y={hitY}
          width={hitWidth}
          height={hitHeight}
          fill="#000"
          opacity={0.001}
          onPress={() => onShelfPress?.(shelf, zone)}
        />

        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={baseColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={baseColor} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Pulse Effect for Recommended */}
        {isRecommended && (
          <Rect
            x={absX - 2}
            y={absY - 2}
            width={shelf.width + 4}
            height={shelf.height + 4}
            rx={5}
            ry={5}
            fill={COLORS.success}
            opacity={0.15}
          />
        )}

        {/* Rack Shadow */}
        {!isDimmed && (
          <Rect
            x={absX}
            y={absY + 2}
            width={shelf.width}
            height={shelf.height}
            rx={3}
            ry={3}
            fill="#000"
            opacity={0.08}
          />
        )}

        {/* Rack Body */}
        <Rect
          x={absX}
          y={absY}
          width={shelf.width}
          height={shelf.height}
          rx={2}
          ry={2}
          fill={`url(#${gradientId})`}
          stroke={strokeColor}
          strokeWidth={isRecommended || isHighlighted ? 1.2 : 0.5}
        />

        {/* Top Face */}
        <Rect
          x={absX + 1}
          y={absY + 1}
          width={shelf.width - 2}
          height={shelf.height - 4}
          rx={1}
          ry={1}
          fill={faceColor}
          opacity={0.7}
        />

        {/* Label Badge */}
        <G pointerEvents="none">
          <Rect
            x={absX + (shelf.width - 24) / 2}
            y={absY + (shelf.height - 14) / 2}
            width={24}
            height={14}
            rx={7}
            fill={
              isRecommended
                ? COLORS.successText
                : isHighlighted
                  ? COLORS.primary
                  : "#1E293B"
            }
            opacity={isDimmed ? 0.4 : 0.95}
          />
          <SvgText
            x={absX + shelf.width / 2}
            y={absY + shelf.height / 2 + 1}
            fontSize={8}
            fill="#FFFFFF"
            fontWeight="900"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {shelf.code}
          </SvgText>
        </G>
      </G>
    );
  };

  const renderZone = (zone: WarehouseZone, zoneIndex: number) => {
    return (
      <G key={`zone-${zone.id}-${zoneIndex}`}>
        <Rect
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          rx={12}
          ry={12}
          fill={COLORS.primary}
          opacity={0.02}
          onPress={() => onZonePress?.(zone)}
        />

        <Rect
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          rx={12}
          ry={12}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth={1}
          strokeDasharray="6,4"
          opacity={0.2}
        />

        <G>
          <Rect
            x={zone.x + 12}
            y={zone.y + 12}
            width={Math.max((zone.code?.length ?? 0) * 8 + 35, 65)}
            height={24}
            rx={12}
            fill={COLORS.primary}
            opacity={0.15}
          />
          <SvgText
            x={
              zone.x + 12 + Math.max((zone.code?.length ?? 0) * 8 + 35, 65) / 2
            }
            y={zone.y + 24}
            fontSize={11}
            fill={COLORS.primary}
            fontWeight="900"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {zone.code
              ? zone.code.toLowerCase().includes("zone")
                ? zone.code
                : `Zone ${zone.code}`
              : "Zone"}
          </SvgText>
        </G>

        {(zone.shelves ?? []).map((shelf, shelfIndex) =>
          renderShelf(shelf, zone, shelfIndex),
        )}
      </G>
    );
  };

  const renderPath = () => {
    if (!highlightedPath || highlightedPath.length < 2) return null;

    const pathLines = [];
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      const start = highlightedPath[i];
      const end = highlightedPath[i + 1];
      pathLines.push(
        <G key={`path-${i}`}>
          <Line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={COLORS.secondary}
            strokeWidth={8}
            opacity={0.2}
            strokeLinecap="round"
          />
          <Line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={COLORS.secondary}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </G>,
      );
    }
    return <G>{pathLines}</G>;
  };

  return (
    <View className="flex-1 bg-slate-100 rounded-[32px] mx-4 mb-5 overflow-hidden border-[1.5px] border-white shadow-[0_12px_24px_rgba(15,23,42,0.15)] elevation-8">
      <GestureDetector gesture={composedGesture}>
        <Animated.View className="flex-1" onLayout={onMapLayout}>
          <Animated.View style={animatedStyle}>
            <Svg
              width={structure.width}
              height={structure.height}
              viewBox={`0 0 ${structure.width} ${structure.height}`}
            >
              <Defs>
                <Pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <Circle
                    cx="10"
                    cy="10"
                    r="0.8"
                    fill="#CBD5E1"
                    opacity={0.4}
                  />
                </Pattern>
              </Defs>

              <Rect width="100%" height="100%" fill="url(#grid)" />

              {normalizedZones.map((zone, zoneIndex) =>
                renderZone(zone, zoneIndex),
              )}
              {renderPath()}

              {showNodes && (
                <G>
                  {/* Nodes */}
                  {(structure.nodes ?? []).map((node) => (
                    <Circle
                      key={`node-${node.id}`}
                      cx={node.x}
                      cy={node.y}
                      r={3.5}
                      fill={COLORS.info}
                      opacity={0.5}
                    />
                  ))}
                </G>
              )}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Modern Floating UI */}
      <View className="absolute top-5 right-5 gap-2.5 items-center">
        <TouchableOpacity
          className="w-11 h-11 rounded-[14px] bg-white/95 justify-center items-center border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.08)] elevation-4"
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-11 h-11 rounded-[14px] bg-white/95 justify-center items-center border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.08)] elevation-4"
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          className="mt-2 w-11 h-11 rounded-[14px] bg-white/95 justify-center items-center border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.08)] elevation-4"
          onPress={calculateInitialFit}
          activeOpacity={0.7}
        >
          <Feather name="maximize" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-11 h-11 rounded-[14px] justify-center items-center border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.08)] elevation-4"
          style={{
            backgroundColor: showNodes
              ? COLORS.primary
              : "rgba(255, 255, 255, 0.95)",
          }}
          onPress={() => setShowNodes(!showNodes)}
          activeOpacity={0.7}
        >
          <Feather
            name="navigation"
            size={20}
            color={showNodes ? "#FFF" : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-around py-5 bg-white border-t border-slate-100">
        <View className="flex-row items-center gap-2">
          <View
            className="w-[14px] h-[14px] rounded-[5px]"
            style={{ backgroundColor: COLORS.primary, opacity: 0.3 }}
          />
          <Text className="text-[13px] font-bold text-slate-500">Zone</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View
            className="w-[14px] h-[14px] rounded-[5px]"
            style={{ backgroundColor: COLORS.success }}
          />
          <Text className="text-[13px] font-bold text-slate-500">
            Suggested Position
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-[14px] h-[14px] rounded-[5px] bg-slate-200 border border-slate-300" />
          <Text className="text-[13px] font-bold text-slate-500">Shelf</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View
            className="w-[14px] h-[14px] rounded-[5px]"
            style={{ backgroundColor: COLORS.secondary }}
          />
          <Text className="text-[13px] font-bold text-slate-500">Path</Text>
        </View>
      </View>
    </View>
  );
};
