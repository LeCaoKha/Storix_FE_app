import { RefreshContainer, ScreenHeader } from "@/components";
import { getBottomSafePadding } from "@/components/ui/safeArea";
import { COLORS } from "@/constants/color";
import {
  useOutboundTicket,
  useUpdateOutboundTicketItems,
  useUpdateOutboundTicketStatus
} from "@/hooks";
import { useAppBack } from "@/hooks/useAppBack";
import { useTranslation } from "@/hooks/useTranslation";
import { useWarehouseStructure } from "@/hooks/warehouse.hooks";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/services/axios.instance";
import type { OutboundOrderItem } from "@/types/outbound-order";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// BE Status Flow (Staff allowed transitions):
// Created → Picking → QualityCheck → (IssueReported | Packing) → Packing → LoadHandover
// Manager confirms LoadHandover → Completed
type TicketStatus =
  | "Created"
  | "Picking"
  | "QualityCheck"
  | "IssueReported"
  | "Packing"
  | "LoadHandover"
  | "Completed";

export default function OutboundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const goBack = useAppBack();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  // BE Status Flow (Staff allowed transitions):
  // Created → Picking → QualityCheck → (IssueReported | Packing) → Packing → LoadHandover
  // Manager confirms LoadHandover → Completed
  const STATUS_CONFIG: Record<
    TicketStatus,
    { label: string; color: string; bgColor: string }
  > = {
    Created: {
      label: t("common.pending"),
      color: COLORS.warning,
      bgColor: COLORS.warning + "20",
    },
    Picking: {
      label: t("tasks.pickItems"),
      color: COLORS.primary,
      bgColor: COLORS.primaryLight + "20",
    },
    QualityCheck: {
      label: t("outbound.qualityCheck"),
      color: "#7C3AED",
      bgColor: "#7C3AED20",
    },
    IssueReported: {
      label: t("outbound.issue"),
      color: COLORS.danger,
      bgColor: COLORS.danger + "20",
    },
    Packing: {
      label: t("outbound.packing"),
      color: COLORS.teal600,
      bgColor: COLORS.teal50,
    },
    LoadHandover: {
      label: t("common.pending"),
      color: COLORS.warning,
      bgColor: COLORS.warning + "20",
    },
    Completed: {
      label: t("common.done"),
      color: COLORS.success,
      bgColor: COLORS.success + "20",
    },
  };

  // Get next staff action based on current status
  const getNextAction = (
    status: TicketStatus,
  ): { label: string; nextStatus: TicketStatus; color: string } | null => {
    switch (status) {
      case "Created":
        return {
          label: t("outbound.startPicking"),
          nextStatus: "Picking",
          color: COLORS.primary,
        };
      case "Picking":
        return {
          label: t("outbound.finishPicking"),
          nextStatus: "QualityCheck",
          color: "#7C3AED",
        };
      case "QualityCheck":
        return {
          label: t("outbound.passAndPack"),
          nextStatus: "Packing",
          color: COLORS.teal600,
        };
      case "IssueReported":
        return {
          label: t("outbound.resolved"),
          nextStatus: "Packing",
          color: COLORS.teal600,
        };
      case "Packing":
        return {
          label: t("outbound.complete"),
          nextStatus: "LoadHandover",
          color: COLORS.warning,
        };
      default:
        return null;
    }
  };

  // Get previous staff action based on current status
  const getPreviousAction = (
    status: TicketStatus,
  ): { label: string; prevStatus: TicketStatus; color: string } | null => {
    switch (status) {
      case "Picking":
        return {
          label: t("common.undo"),
          prevStatus: "Created",
          color: COLORS.textMuted,
        };
      case "QualityCheck":
        return {
          label: t("common.back"),
          prevStatus: "Picking",
          color: COLORS.textMuted,
        };
      case "IssueReported":
        return {
          label: t("common.cancel"),
          prevStatus: "QualityCheck",
          color: COLORS.textMuted,
        };
      case "Packing":
        return {
          label: t("common.back"),
          prevStatus: "QualityCheck",
          color: COLORS.textMuted,
        };
      default:
        return null;
    }
  };
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  const {
    data: order,
    isLoading,
    refetch,
  } = useOutboundTicket(numericId);
  const { data: warehouseStructure } = useWarehouseStructure(
    order?.warehouseId || order?.warehouse?.id,
  );

  const error = !isLoading && !order;

  const updateItems = useUpdateOutboundTicketItems();
  const updateStatus = useUpdateOutboundTicketStatus();

  const [localQuantities, setLocalQuantities] = useState<Record<number, any>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFifoLoading, setIsFifoLoading] = useState(false);
  const [fifoBins, setFifoBins] = useState<string[]>([]);
  const [fifoSuggestionsMap, setFifoSuggestionsMap] = useState<Record<number, any[]>>({});
  const [fifoSummaryMap, setFifoSummaryMap] = useState<Record<number, { requiredQuantity: number; totalAvailableQuantity: number; remainingQuantity: number }>>({});

  const locationLabelIndex = React.useMemo(() => {
    const index = new Map<
      string,
      { zoneLabel?: string; shelfLabel?: string; levelLabel?: string }
    >();

    (warehouseStructure?.zones ?? []).forEach((zone, zoneIndex) => {
      const zoneLabel = String(zone.code ?? `${t('warehouse.zone')} ${zoneIndex + 1}`);
      (zone.shelves ?? []).forEach((shelf, shelfIndex) => {
        const shelfLabel = String(shelf.code ?? `${t('warehouse.shelf')} ${shelfIndex + 1}`);
        (shelf.levels ?? []).forEach((level, levelIndex) => {
          const levelLabel = String(level.code ?? `${t('warehouse.level')} ${levelIndex + 1}`);
          (level.bins ?? []).forEach((bin) => {
            const keys = [bin.id, bin.code, shelf.id, shelf.code, level.id, level.code]
              .map((value) => String(value ?? "").trim())
              .filter(Boolean);

            keys.forEach((key) => {
              if (!index.has(key)) {
                index.set(key, {
                  zoneLabel,
                  shelfLabel,
                  levelLabel,
                });
              }
            });
          });
        });
      });
    });

    return index;
  }, [warehouseStructure]);

  // ===== ADDED CODE START =====
  const [itemsToPick, setItemsToPick] = useState<any[]>([]);

  const getLocationLabels = (suggestion: any) => {
    const locationKeyCandidates = [
      suggestion?.binCode,
      suggestion?.binIdCode,
      suggestion?.binId,
      suggestion?.shelfCode,
      suggestion?.shelfId,
      suggestion?.zoneId,
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);

    for (const key of locationKeyCandidates) {
      const matched = locationLabelIndex.get(key);
      if (matched) {
        return {
          zoneLabel: matched.zoneLabel || t('common.notAvailable'),
          shelfLabel: matched.shelfLabel || suggestion?.shelfCode || t('common.notAvailable'),
          levelLabel: matched.levelLabel || suggestion?.binCode || t('common.notAvailable'),
        };
      }
    }

    return {
      zoneLabel: suggestion?.zoneId != null ? `${t('warehouse.zone')} ${suggestion.zoneId}` : t('common.notAvailable'),
      shelfLabel: suggestion?.shelfCode || t('common.notAvailable'),
      levelLabel: suggestion?.binCode || t('common.notAvailable'),
    };
  };

  // Thêm cái useEffect này để log itemsToPick mỗi khi nó thay đổi
  useEffect(() => {
    if (itemsToPick && itemsToPick.length > 0) {
      console.log("========== LOG ITEMSTOPICK ==========");
      console.log(JSON.stringify(itemsToPick, null, 2));
      console.log("=====================================");
    }
  }, [itemsToPick]);
  // ===== ADDED CODE END =====

  useEffect(() => {
    const fetchFifoSuggestions = async () => {
      if (!numericId) {
        setFifoBins([]);
        return;
      }

      setIsFifoLoading(true);
      try {
        const response = await api.get(`/api/InventoryOutbound/tickets/${numericId}/fifo-suggestions`);
        const data = response.data;
        const bins = new Set<string>();
        const map: Record<number, any[]> = {};
        const summaryMap: Record<number, { requiredQuantity: number; totalAvailableQuantity: number; remainingQuantity: number }> = {};

        (Array.isArray(data) ? data : []).forEach((item: any) => {
          const productId = Number(item.productId || item.product?.id || 0);
          const suggestions = item.suggestions || [];
          map[productId] = suggestions;
          summaryMap[productId] = {
            requiredQuantity: Number(item.requiredQuantity || 0),
            totalAvailableQuantity: Number(item.totalAvailableQuantity || 0),
            remainingQuantity: Number(item.remainingQuantity || 0),
          };

          suggestions.forEach((suggestion: any) => {
            [suggestion.binCode, suggestion.binIdCode, suggestion.shelfCode]
              .map((value) => String(value ?? '').trim())
              .filter(Boolean)
              .forEach((value) => bins.add(value));
          });
        });

        setFifoBins(Array.from(bins));
        setFifoSuggestionsMap(map);
        setFifoSummaryMap(summaryMap);
      } catch (error) {
        console.error('Fetch FIFO suggestions error:', error);
        setFifoBins([]);
        setFifoSuggestionsMap({});
        setFifoSummaryMap({});
      } finally {
        setIsFifoLoading(false);
      }
    };

    fetchFifoSuggestions();
  }, [numericId]);

  const rawStatus = order?.status as string;
  const currentStatus =
    (rawStatus === "READY" ? "Created" : (rawStatus as TicketStatus)) ||
    "Created";
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Created;
  const nextAction = getNextAction(currentStatus);
  const prevAction = getPreviousAction(currentStatus);

  const canEditItems =
    currentStatus !== "Created" &&
    currentStatus !== "LoadHandover" &&
    currentStatus !== "Completed";

  const showSaveBtn =
    currentStatus === "QualityCheck" || currentStatus === "IssueReported";

  useEffect(() => {
    const orderItems = order?.items || order?.outboundOrderItems;
    if (orderItems) {
      setLocalQuantities((prev) => {
        const nextState = { ...prev };
        orderItems.forEach((item: OutboundOrderItem) => {
          const beQty =
            (item as any).pickedQuantity ?? (item as any).actualQuantity;
          if (beQty !== undefined && beQty !== null && beQty > 0) {
            nextState[item.id] = beQty;
          } else if (nextState[item.id] === undefined) {
            nextState[item.id] = 0;
          }
        });
        return nextState;
      });
    }
  }, [order]);

  // ===== ADDED CODE START =====
  // FEATURE 1: FETCH PATH OPTIMIZATION ON LOAD
  useEffect(() => {
    const fetchPathOptimization = async () => {
      if (!numericId) return;
      try {
        console.log(
          `\n--- GỌI API PATH OPTIMIZATION CHO TICKET ID: ${numericId} ---`,
        );

        const response = await api.get(`/api/InventoryOutbound/tickets/${numericId}/path-optimization`);

        console.log("-> Mã trạng thái HTTP (Status):", response.status);

        const responseData = response.data;

        console.log("-> Dữ liệu JSON bóc từ Response:");
        console.log(JSON.stringify(responseData, null, 2));
        console.log(
          "------------------------------------------------------------\n",
        );

        const payloadData = responseData?.payload?.[0];

        if (payloadData && payloadData.status === "success") {
          setItemsToPick(payloadData.itemsToPick || []);
        }
      } catch (err) {
        console.error(
          "-> Lỗi mạng hoặc code lúc fetch path optimization:",
          err,
        );
      }
    };

    fetchPathOptimization();
  }, [numericId]);
  // ===== ADDED CODE END =====

  const sortedItems = React.useMemo(() => {
    const orderItems = order?.items || order?.outboundOrderItems;
    if (!orderItems) return [];
    return [...orderItems].sort((a, b) => {
      const nameA = a.productName || a.name || a.product?.name || "";
      const nameB = b.productName || b.name || b.product?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [order]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title={t("common.loading")} />
      </View>
    );
  }

  if (!order || error) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title={t("common.error")} />
        <View className="flex-1 justify-center items-center p-5">
          <Feather name="alert-circle" size={48} color={COLORS.danger} />
          <Text
            className="text-base mt-3 mb-6 text-center"
            style={{ color: COLORS.textMuted }}
          >
            {t("common.noData")}
          </Text>
          <TouchableOpacity
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: COLORS.primary }}
            onPress={goBack}
          >
            <Text className="text-white font-bold">{t("common.back")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleUpdateQty = (itemId: number, increment: boolean) => {
    if (!canEditItems) {
      AlertService.warning(
        t("outbound.cannotEdit"),
        t("outbound.cannotEditMsg"),
      );
      return;
    }
    setLocalQuantities((prev) => {
      const current = Number(prev[itemId]) || 0;
      const orderItems = order?.items || order?.outboundOrderItems || [];
      const item = orderItems.find((i: OutboundOrderItem) => i.id === itemId);
      
      // Lấy giới hạn tối đa: Ưu tiên số lượng sẵn sàng trong kho (FIFO) nếu có
      const productId = item?.productId || 0;
      const availableInWarehouse = fifoSummaryMap[Number(productId)]?.totalAvailableQuantity;
      const requiredQty = item?.quantity || 0;
      
      // Giới hạn trên là số nhỏ hơn giữa (Yêu cầu) và (Thực tế có sẵn)
      const maxQty = availableInWarehouse !== undefined 
        ? Math.min(requiredQty, availableInWarehouse) 
        : requiredQty;

      const newValue = increment
        ? Math.min(current + 1, maxQty)
        : Math.max(current - 1, 0);

      return { ...prev, [itemId]: newValue };
    });
  };

  const handleSaveItems = async () => {
    if (!order || !showSaveBtn) return;
    setIsSaving(true);
    try {
      const orderItems = order.items || order.outboundOrderItems || [];
      const updatedItems = orderItems.map((item: OutboundOrderItem) => ({
        id: item.id,
        productId: item.productId || 0,
        quantity: item.quantity || 1,
        actualQuantity: Number(localQuantities[item.id]) || 0,
        pickedQuantity: Number(localQuantities[item.id]) || 0,
      }));

      await updateItems.mutateAsync({
        ticketId: order.id,
        items: updatedItems,
      });

      AlertService.success(
        t("common.success"),
        t("warehouse.recordedSuccessfully"),
      );
    } catch (error) {
      console.error("Save Items Error:", error);
      AlertService.error(t("common.error"), t("common.failed"));
    } finally {
      setIsSaving(false);
    }
  };

  // ===== ADDED CODE START =====
  // FEATURE 2: HANDLE PACKING -> HANDOVER
  const handleHandover = async () => {
    if (!numericId || !itemsToPick || itemsToPick.length === 0) return;

    try {
      const orderItems = order?.items || order?.outboundOrderItems || [];
      const payload = orderItems.map((item: any) => {
        const uiQuantity = Number(localQuantities[item.id]) || 0;
        let remainingQty = uiQuantity;
        const mappedLocations: any[] = [];
        
        // Prioritize optimized path suggestions if available
        const optimizedItem = itemsToPick.find(it => it.productId === item.productId);
        const suggestions = optimizedItem?.locationData?.rawFifoSuggestions || fifoSuggestionsMap[item.productId] || [];

        for (const suggestion of suggestions) {
          if (remainingQty <= 0) break;

          const qtyForThisBin = Math.min(
            remainingQty,
            suggestion.suggestedPickQty || suggestion.availableInBin || 0,
          );

          if (qtyForThisBin > 0) {
            mappedLocations.push({
              binId: suggestion.binIdCode || suggestion.binCode || suggestion.binId,
              quantity: qtyForThisBin,
              batchId: suggestion.batchId, // Crucial for FIFO tracking
            });
            remainingQty -= qtyForThisBin;
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          expectedQuantity: item.quantity,
          receivedQuantity: uiQuantity,
          locations: mappedLocations,
        };
      });

      console.log("========== HANDOVER PAYLOAD ==========");
      console.log(JSON.stringify(payload, null, 2));
      console.log("======================================");

      await api.put(`/api/InventoryOutbound/tickets/${numericId}/items`, payload);
    } catch (err) {
      console.log("Handover API error:", err);
      throw err; // Quăng lỗi lên cho hàm handleTransition bắt
    }
  };
  // ===== ADDED CODE END =====

  const handleTransition = async () => {
    if (!order || !user || !nextAction) return;

    const executeTransition = async () => {
      setIsTransitioning(true);
      try {
        // ===== ADDED CODE START =====
        if (nextAction.nextStatus === "QualityCheck" || nextAction.nextStatus === "LoadHandover") {
          await handleHandover();
        }
        // ===== ADDED CODE END =====

        await updateStatus.mutateAsync({
          ticketId: order.id,
          performedBy: user.id || 0,
          status: nextAction.nextStatus,
        });

        AlertService.success(
          t("common.success"),
          `${t("tasks.status")}: ${STATUS_CONFIG[nextAction.nextStatus].label}`,
        );
      } catch (error) {
        console.error(error);
        AlertService.error(t("common.error"), t("common.failed"));
      } finally {
        setIsTransitioning(false);
      }
    };

    if (nextAction.nextStatus === "Picking") {
      executeTransition();
      return;
    }

    const confirmMsg =
      nextAction.nextStatus === "LoadHandover"
        ? t("outbound.handoverMsg")
        : `${t("common.confirm")} "${STATUS_CONFIG[nextAction.nextStatus].label}"?`;

    AlertService.confirm(nextAction.label, confirmMsg, executeTransition);
  };

  const handleRevertStatus = () => {
    if (!order || !user || !prevAction) return;

    AlertService.confirm(
      t("common.undo"),
      t("outbound.revertConfirm", {
        status: STATUS_CONFIG[prevAction.prevStatus].label,
      }),
      async () => {
        setIsTransitioning(true);
        try {
          await updateStatus.mutateAsync({
            ticketId: order.id,
            performedBy: user.id || 0,
            status: prevAction.prevStatus,
          });

          AlertService.success(
            t("common.success"),
            t("outbound.revertSuccess", {
              status: STATUS_CONFIG[prevAction.prevStatus].label,
            }),
          );
        } catch {
          AlertService.error(t("common.error"), t("outbound.revertFailedMsg"));
        } finally {
          setIsTransitioning(false);
        }
      },
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title={t("outbound.ticketTitle")}
        subtitle={order.note || `OUT-${order.id}`}
      />


      <RefreshContainer
        onRefresh={async () => {
          await refetch();
        }}
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 120 + insets.bottom,
        }}
      >
        {/* Info Card */}
        <View className="mb-4 bg-white p-4 rounded-xl shadow-sm">
          <View className="flex-row items-center mb-2.5">
            <Text
              className="text-sm mr-2.5"
              style={{ color: COLORS.textMuted }}
            >
              {t("tasks.status")}:
            </Text>
            <View
              className="px-2 py-1 rounded-md"
              style={{ backgroundColor: statusConfig.bgColor }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: statusConfig.color }}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center mb-2.5">
            <Feather
              name="user"
              size={16}
              color={COLORS.textMuted}
              className="mr-2.5"
            />
            <Text className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("tasks.createdBy")}:{" "}
              <Text className="font-semibold text-slate-800">
                {order.createdByUser?.fullName ||
                  order.createdByUser?.email ||
                  order.createdByNavigation?.email ||
                  t('common.notAvailable')}
              </Text>
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather
              name="map-pin"
              size={16}
              color={COLORS.textMuted}
              className="mr-2.5"
            />
            <Text className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("tasks.destination")}:{" "}
              <Text className="font-semibold text-slate-800">
                {order.destination || t('common.notAvailable')}
              </Text>
            </Text>
          </View>
        </View>

        {/* Warehouse Location Shortcut - HIỂN THỊ Ở TẤT CẢ TRẠNG THÁI */}
        <TouchableOpacity
            className="flex-row items-center bg-white mb-4 p-3.5 rounded-xl shadow-sm border border-slate-100"
            onPress={() => {
              const allBins: string[] = [];
              router.push({
                pathname: "/warehouse-view",
                params: {
                  warehouseId: String(
                    order.warehouse?.id || order.warehouseId || "",
                  ),
                  outboundOrderId: String(order.id),
                  focusedBins: allBins.join(","),
                  // ===== THÊM DÒNG NÀY VÀO =====
                  status: "path_optimization",
                  // ==============================
                },
              } as any);
            }}
          >
            <View
              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.primary + "10" }}
            >
              <Feather name="map" size={18} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-800">
                {t("outbound.warehouseMap")}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: COLORS.textMuted }}
              >
                {t("outbound.tapToNavigate")}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>


        <View className="flex-row justify-between items-end mb-3 mt-2">
          <Text className="text-base font-bold text-slate-800">
            {t("outbound.productList")}
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textMuted }}>
            {(order.items || order.outboundOrderItems)?.length ?? 0}{" "}
            {t("common.items")}
          </Text>
        </View>

        {/* Item Cards */}
        {sortedItems.map((item: OutboundOrderItem) => {
          const pickedLocations = (item as any).pickedLocations || (item as any).selectedPickLocations || [];
          const optimizedItem = itemsToPick?.find(it => it.productId === item.productId);
          const optimizedLocations = optimizedItem?.locationData?.rawFifoSuggestions || [];
          const rawFifoSuggestions = fifoSuggestionsMap[Number(item.productId || 0)] || [];

          const displayLocations = pickedLocations.length > 0 
            ? pickedLocations 
            : (optimizedLocations.length > 0 ? optimizedLocations : rawFifoSuggestions);

          return (
            <View
              key={item.id}
              className="mb-3 bg-white p-4 rounded-xl shadow-sm"
            >
              {/* Header Row: Product Name & Status Badge */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-slate-800 mb-1">
                    {item.productName ||
                      item.name ||
                      item.product?.name ||
                      `${t("common.product")} #${item.productId}`}
                  </Text>
                  {(item.sku || item.product?.sku) && (
                    <View className="bg-slate-100 px-2 py-1 rounded self-start">
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: COLORS.textMuted }}
                      >
                        {item.sku || item.product?.sku}
                      </Text>
                    </View>
                  )}
                </View>

                {(() => {
                  const pickedQty = Number(localQuantities[item.id]) || 0;
                  const requiredQty = item.quantity || 0;
                  const availableInWarehouse = fifoSummaryMap[Number(item.productId)]?.totalAvailableQuantity;
                  
                  // Được coi là Xong nếu: Lấy đủ yêu cầu HOẶC đã lấy hết sạch hàng có trong kho
                  const isFulfilled = pickedQty >= requiredQty;
                  const isExhausted = availableInWarehouse !== undefined && pickedQty >= availableInWarehouse && pickedQty > 0;
                  
                  if (currentStatus !== "Created" && (isFulfilled || isExhausted)) {
                    return (
                      <View
                        className="px-2 py-1 rounded-md"
                        style={{ backgroundColor: COLORS.success + "20" }}
                      >
                        <Text className="text-xs font-bold" style={{ color: COLORS.success }}>
                          {t("common.done")}
                        </Text>
                      </View>
                    );
                  }
                  return null; // Ẩn nhãn "Chờ xử lý" theo yêu cầu của người dùng
                })()}
              </View>

              {/* Locations Row: Scrollable list of suggested/picked locations */}
              {displayLocations.length > 0 ? (
                <>
                  <View className="flex-row items-center justify-between mb-2 px-1">
                    <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {t('warehouse.suggestedLocations')}
                    </Text>
                    {displayLocations.length > 2 && (
                      <View className="flex-row items-center">
                        <Text className="text-[10px] text-cyan-600 font-medium mr-1">
                          {t('common.swipeHint')}
                        </Text>
                        <Feather name="chevron-right" size={12} color={COLORS.primary} />
                      </View>
                    )}
                  </View>

                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    className="mb-3"
                    contentContainerStyle={{ paddingRight: 20 }}
                  >
                  {displayLocations.map((sug: any, index: number) => {
                    const labels = getLocationLabels(sug);
                    const isPicked = pickedLocations.length > 0;
                    const zoneText = isPicked ? (sug.zoneCode || sug.zoneName) : labels.zoneLabel;
                    const shelfText = isPicked ? (sug.shelfCode || sug.shelfName) : labels.shelfLabel;
                    const levelText = isPicked ? (sug.binCode || sug.binName || sug.binIdCode) : labels.levelLabel;
                    const qty = isPicked ? (sug.quantity ?? 0) : (sug.suggestedPickQty ?? sug.availableInBin ?? 0);

                    return (
                      <View
                        key={`${item.id}-${sug.binId || sug.binCode || sug.binIdCode || index}-${sug.batchId || ''}`}
                        className="bg-cyan-50/50 border border-cyan-100 px-3 py-2 rounded-lg mr-2"
                        style={{ minWidth: 110 }}
                      >
                        <View className="flex-row items-center mb-1">
                          <Feather name="map-pin" size={10} color={COLORS.primary} style={{ marginRight: 4 }} />
                          <Text className="text-[11px] font-bold" style={{ color: COLORS.primary }}>
                            {zoneText || t('common.notAvailable')}
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[10px] text-slate-500 font-medium">
                            {shelfText || t('common.notAvailable')} • {levelText || t('common.notAvailable')}
                          </Text>
                        </View>

                        <View className="mt-1.5 pt-1.5 border-t border-cyan-100/50 flex-row justify-between items-center">
                          <Feather name="package" size={10} color={COLORS.primary} style={{ marginRight: 4 }} />
                          <Text className="text-[11px] font-bold" style={{ color: COLORS.primary }}>
                            {qty} pcs
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
              ) : isFifoLoading ? (
                <View className="flex-row items-center mb-3">
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text className="text-[11px] ml-2 text-slate-400 font-medium">
                    {t('warehouse.loadingSuggestions')}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center mb-3 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                   <Feather name="info" size={12} color={COLORS.textMuted} />
                   <Text className="text-[11px] ml-1.5 text-slate-400 font-medium">
                     {t('warehouse.noSuggestions')}
                   </Text>
                </View>
              )}

              {/* Quantity Input & Info Row */}
              <View className="flex-row justify-between items-center mt-2 border-t border-slate-50 pt-3">
                <Text className="text-sm font-medium text-slate-700">
                  {currentStatus === "Created"
                    ? t("outbound.itemQty")
                    : currentStatus === "Picking"
                      ? t("outbound.pickedQty")
                      : t("outbound.readyQty")}
                </Text>

                {canEditItems ? (
                  <View className="flex-row items-center bg-slate-100 rounded-xl p-1">
                    <TouchableOpacity
                      className="w-10 h-10 rounded-lg bg-white justify-center items-center shadow-sm"
                      onPress={() => handleUpdateQty(item.id, false)}
                    >
                      <Feather name="minus" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <View className="flex-row items-baseline px-2 min-w-[70px] justify-center">
                      <TextInput
                        className="text-lg font-bold text-center p-0 m-0"
                        style={{ color: COLORS.primary, minWidth: 32 }}
                        keyboardType="numeric"
                        value={
                          localQuantities[item.id] !== undefined
                            ? String(localQuantities[item.id])
                            : "0"
                        }
                        onChangeText={(text) => {
                          if (text === "") {
                            setLocalQuantities((prev) => ({
                              ...prev,
                              [item.id]: "",
                            }));
                            return;
                          }
                          const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                          if (isNaN(num)) return;

                          // Lấy giới hạn tối đa tương tự như handleUpdateQty
                          const productId = item.productId || 0;
                          const availableInWarehouse = fifoSummaryMap[Number(productId)]?.totalAvailableQuantity;
                          const requiredQty = item.quantity || 0;
                          
                          const maxQty = availableInWarehouse !== undefined 
                            ? Math.min(requiredQty, availableInWarehouse) 
                            : requiredQty;

                          setLocalQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.min(num, maxQty),
                          }));
                        }}
                      />
                      <Text
                        className="text-sm ml-1"
                        style={{ color: COLORS.textMuted }}
                      >
                        / {item.quantity || 0}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="w-10 h-10 rounded-lg bg-white justify-center items-center shadow-sm"
                      onPress={() => handleUpdateQty(item.id, true)}
                    >
                      <Feather name="plus" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-row items-baseline px-2 justify-center">
                    {currentStatus === "Created" ? (
                      <Text
                        className="text-lg font-bold"
                        style={{ color: COLORS.primary }}
                      >
                        {item.quantity || 0}
                      </Text>
                    ) : (
                      <>
                        <Text
                          className="text-lg font-bold"
                          style={{
                            color: currentStatus === "Completed" ? COLORS.success : COLORS.primary,
                          }}
                        >
                          {Number(localQuantities[item.id]) || 0}
                        </Text>
                        <Text
                          className="text-sm ml-1"
                          style={{ color: COLORS.textMuted }}
                        >
                          / {item.quantity || 0}
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* FIFO Summary Row */}
              {fifoSummaryMap[Number(item.productId || 0)] && (
                <View className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                  <Text className="text-xs font-medium" style={{ color: COLORS.textMuted }}>
                    {t("warehouse.readyQuantity")}: {fifoSummaryMap[Number(item.productId || 0)].totalAvailableQuantity} / {fifoSummaryMap[Number(item.productId || 0)].requiredQuantity || item.quantity || 0}
                  </Text>
                  {fifoSummaryMap[Number(item.productId || 0)].remainingQuantity > 0 && (
                    <Text className="text-xs mt-0.5 font-semibold" style={{ color: COLORS.warning }}>
                      {t("warehouse.shortage")}: {fifoSummaryMap[Number(item.productId || 0)].remainingQuantity}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </RefreshContainer>

      {/* Bottom Footer */}
      <View
        className="p-5 bg-white flex-row items-center border-t border-slate-200"
        style={{ paddingBottom: getBottomSafePadding(insets.bottom, 20) }}
      >
        {prevAction && (
          <TouchableOpacity
            className={`flex-1 h-14 rounded-xl border justify-center items-center flex-row shadow-sm ${
              isTransitioning ? "opacity-60" : ""
            }`}
            style={{
              borderColor: COLORS.borderLight,
              backgroundColor: "#f8fafc",
            }}
            onPress={handleRevertStatus}
            disabled={isTransitioning}
          >
            <Feather
              name="corner-up-left"
              size={18}
              color={COLORS.textMuted}
              className="mr-2"
            />
            <Text
              className="text-sm font-bold"
              style={{ color: COLORS.textMuted }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {prevAction.label}
            </Text>
          </TouchableOpacity>
        )}

        {showSaveBtn && (
          <TouchableOpacity
            className={`flex-[1.5] h-14 rounded-xl justify-center items-center shadow-sm ml-3 ${
              isSaving ? "opacity-60" : ""
            }`}
            style={{ backgroundColor: COLORS.primary }}
            onPress={handleSaveItems}
            disabled={isSaving}
          >
            <Text
              className="text-base font-bold text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isSaving ? t("common.loading") : t("common.save")}
            </Text>
          </TouchableOpacity>
        )}

        {nextAction && (
          <TouchableOpacity
            className={`flex-[1.5] h-14 rounded-xl flex-row justify-center items-center shadow-sm ml-3 ${
              isTransitioning ? "opacity-60" : ""
            }`}
            style={{ backgroundColor: nextAction.color }}
            onPress={handleTransition}
            disabled={isTransitioning}
          >
            <Feather
              name="arrow-right-circle"
              size={20}
              color="#fff"
              className="mr-2"
            />
            <Text
              className="text-base font-bold text-white"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isTransitioning ? "..." : nextAction.label}
            </Text>
          </TouchableOpacity>
        )}

        {currentStatus === "LoadHandover" && (
          <View
            className="flex-1 h-14 rounded-xl flex-row justify-center items-center shadow-sm"
            style={{ backgroundColor: COLORS.warning }}
          >
            <Feather name="clock" size={20} color="#fff" className="mr-2" />
            <Text className="text-base font-bold text-white">
              {t("outbound.awaitingApproval")}
            </Text>
          </View>
        )}

        {currentStatus === "Completed" && (
          <View
            className="flex-1 flex-row items-center justify-center h-14 rounded-xl border"
            style={{
              backgroundColor: COLORS.success + "15",
              borderColor: COLORS.success + "30",
            }}
          >
            <Feather
              name="check-circle"
              size={20}
              color={COLORS.success}
              className="mr-2"
            />
            <Text
              className="text-base font-bold"
              style={{ color: COLORS.success }}
            >
              {t("outbound.orderCompleted")}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
