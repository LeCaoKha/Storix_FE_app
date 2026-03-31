import { COLORS } from '@/constants/color';
import { NavigationNode, Shelf, WarehouseStructure, WarehouseZone } from '@/types/warehouse';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import {
    Dimensions,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, LinearGradient, Pattern, Rect, Stop, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
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

  const contentBounds = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const includeRect = (x: number, y: number, width: number, height: number) => {
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

    (structure.zones ?? []).forEach((zone) => {
      includeRect(zone.x, zone.y, zone.width, zone.height);
      (zone.shelves ?? []).forEach((shelf) => {
        includeRect(zone.x + shelf.x, zone.y + shelf.y, shelf.width, shelf.height);
      });
    });

    (structure.nodes ?? []).forEach((node) => includePoint(node.x, node.y, node.radius ?? 2));

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
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
  }, [structure]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NavigationNode>();
    (structure.nodes ?? []).forEach(node => map.set(node.id, node));
    return map;
  }, [structure.nodes]);

  const onMapLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setViewport({ width, height });
    }
  };

  // Initial fit calculation
  const calculateInitialFit = () => {
    const availableWidth = Math.max(viewport.width - PADDING, 1);
    const availableHeight = Math.max(viewport.height - FOOTER_HEIGHT - PADDING, 1);

    const sX = availableWidth / contentBounds.width;
    const sY = availableHeight / contentBounds.height;
    const initialScale = Math.min(sX, sY, 4);

    const scaledWidth = contentBounds.width * initialScale;
    const scaledHeight = contentBounds.height * initialScale;

    scale.value = withSpring(initialScale);
    translateX.value = withSpring((viewport.width - scaledWidth) / 2 - contentBounds.minX * initialScale);
    translateY.value = withSpring((availableHeight - scaledHeight) / 2 - contentBounds.minY * initialScale);
  };

  useEffect(() => {
    calculateInitialFit();
  }, [structure, viewport.width, viewport.height, contentBounds]);

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
    doubleTapGesture
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
    pulse.value = withRepeat(
      withTiming(1.2, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const renderShelf = (shelf: Shelf, zone: WarehouseZone, shelfIndex: number) => {
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
          : '#E2E8F0';

    const faceColor = isHighlighted
      ? COLORS.primaryLight
      : isRecommended
        ? COLORS.successLight
        : isDimmed
          ? COLORS.slate50
          : '#F8FAFC';

    const strokeColor = isHighlighted 
      ? COLORS.primary 
      : isRecommended 
        ? COLORS.success 
        : isDimmed
          ? COLORS.slate300 
          : COLORS.slate400;

    const absX = zone.x + shelf.x;
    const absY = zone.y + shelf.y;
    const hitX = absX - SHELF_HIT_PADDING;
    const hitY = absY - SHELF_HIT_PADDING;
    const hitWidth = shelf.width + SHELF_HIT_PADDING * 2;
    const hitHeight = shelf.height + SHELF_HIT_PADDING * 2;

    return (
      <G key={`shelf-${zone.id}-${shelf.id}-${shelfIndex}`} opacity={isDimmed ? 0.4 : 1}>
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
            fill={isRecommended ? COLORS.successText : (isHighlighted ? COLORS.primary : "#1E293B")}
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
            x={zone.x + 12 + Math.max((zone.code?.length ?? 0) * 8 + 35, 65) / 2}
            y={zone.y + 24}
            fontSize={11}
            fill={COLORS.primary}
            fontWeight="900"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {zone.code ? (zone.code.toLowerCase().includes('zone') ? zone.code : `Zone ${zone.code}`) : 'Khu vực'}
          </SvgText>
        </G>

        {(zone.shelves ?? []).map((shelf, shelfIndex) => renderShelf(shelf, zone, shelfIndex))}
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
            x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            stroke={COLORS.secondary} strokeWidth={8} opacity={0.2} strokeLinecap="round"
          />
          <Line
            x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            stroke={COLORS.secondary} strokeWidth={3} strokeLinecap="round"
          />
        </G>
      );
    }
    return <G>{pathLines}</G>;
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.mapContainer} onLayout={onMapLayout}>
          <Animated.View style={animatedStyle}>
            <Svg
              width={structure.width}
              height={structure.height}
              viewBox={`0 0 ${structure.width} ${structure.height}`}
            >
              <Defs>
                <Pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <Circle cx="10" cy="10" r="0.8" fill="#CBD5E1" opacity={0.4} />
                </Pattern>
              </Defs>

              <Rect width="100%" height="100%" fill="url(#grid)" />

              {(structure.zones ?? []).map((zone, zoneIndex) => renderZone(zone, zoneIndex))}
              {renderPath()}

              {showNodes && (
                <G>
                  {/* Các điểm mốc (Nodes) */}
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
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={styles.glassButton}
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.glassButton}
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.glassButton, { marginTop: 8 }]}
          onPress={calculateInitialFit}
          activeOpacity={0.7}
        >
          <Feather name="maximize" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.glassButton, showNodes && { backgroundColor: COLORS.primary }]}
          onPress={() => setShowNodes(!showNodes)}
          activeOpacity={0.7}
        >
          <Feather name="navigation" size={20} color={showNodes ? '#FFF' : COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary, opacity: 0.3 }]} />
          <Text style={styles.legendLabel}>Khu vực</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendLabel}>Vị trí gợi ý</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' }]} />
          <Text style={styles.legendLabel}>Kệ hàng</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
          <Text style={styles.legendLabel}>Đường đi</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Subtle slate background
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFF',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  mapContainer: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    gap: 10,
    alignItems: 'center',
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  }
});
