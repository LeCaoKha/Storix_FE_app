import { RefreshContainer, ScreenHeader } from "@/components";
import {
    OutboundActionFooter,
    OutboundInfoCard,
    OutboundMapShortcut,
    OutboundProductItem,
} from "@/components/staff/outbound";
import { getBottomSafePadding } from "@/components/ui/safeArea";
import { COLORS } from "@/constants/color";
import {
  useFifoSuggestions,
  useOutboundTicket,
  usePathOptimization,
  useUpdateOutboundHandoverItems,
  useUpdateOutboundTicketItems,
  useUpdateOutboundTicketStatus
} from "@/hooks";
import { useAppBack } from "@/hooks/useAppBack";
import { useTranslation } from "@/hooks/useTranslation";
import { useWarehouseStructure } from "@/hooks/warehouse.hooks";
import { useProductInventoryLocations, useProducts } from "@/hooks/product.hooks";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import type { FifoSummary, HandoverItemPayload, OutboundOrderItem, TicketStatus } from "@/types/outbound-order";
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

  // ——— FIFO Suggestions (dùng hook chuẩn) ———
  const { data: fifoData = [], isLoading: isFifoLoading } = useFifoSuggestions(numericId);

  const fifoSuggestionsMap = React.useMemo(() => {
    const map: Record<number, any[]> = {};
    fifoData.forEach((item) => { map[Number(item.productId)] = item.suggestions ?? []; });
    return map;
  }, [fifoData]);

  const fifoSummaryMap = React.useMemo(() => {
    const map: Record<number, FifoSummary> = {};
    fifoData.forEach((item) => {
      map[Number(item.productId)] = {
        requiredQuantity: Number(item.requiredQuantity ?? 0),
        totalAvailableQuantity: Number(item.totalAvailableQuantity ?? 0),
        remainingQuantity: Number(item.remainingQuantity ?? 0),
      };
    });
    return map;
  }, [fifoData]);

  // ——— Path Optimization (dùng hook chuẩn) ———
  const { data: pathOptData } = usePathOptimization(numericId);

  const itemsToPick = React.useMemo(() => {
    return pathOptData?.payload?.[0]?.itemsToPick ?? [];
  }, [pathOptData]);

  // Mutation bàn giao (Handover)
  const handoverItems = useUpdateOutboundHandoverItems();


  const locationLabelIndex = React.useMemo(() => {
    const index = new Map<
      string,
      { zoneLabel?: string; shelfLabel?: string; levelLabel?: string }
    >();

    (warehouseStructure?.zones ?? []).forEach((zone, zoneIndex) => {
      const zoneLabel = String(zone.code ?? t('warehouse.zoneWithId', { id: zoneIndex + 1 }));
      (zone.shelves ?? []).forEach((shelf, shelfIndex) => {
        const shelfLabel = String(shelf.code ?? t('warehouse.shelfWithId', { id: shelfIndex + 1 }));
        (shelf.levels ?? []).forEach((level, levelIndex) => {
          const levelLabel = String(level.code ?? t('warehouse.levelWithId', { id: levelIndex + 1 }));
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
      zoneLabel: suggestion?.zoneId != null ? t('warehouse.zoneWithId', { id: suggestion.zoneId }) : t('common.notAvailable'),
      shelfLabel: suggestion?.shelfCode || t('common.notAvailable'),
      levelLabel: suggestion?.binCode || t('common.notAvailable'),
    };
  };




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

  // ===== FEATURE 2: HANDLE PACKING -> HANDOVER =====
  const handleHandover = async () => {
    if (!numericId || !itemsToPick || itemsToPick.length === 0) return;

    const orderItems = order?.items || order?.outboundOrderItems || [];
    const payload: HandoverItemPayload[] = orderItems.map((item: any) => {
      const uiQuantity = Number(localQuantities[item.id]) || 0;
      let remainingQty = uiQuantity;
      const mappedLocations: HandoverItemPayload['locations'] = [];

      const optimizedItem = itemsToPick.find((it) => it.productId === item.productId);
      const suggestions =
        optimizedItem?.locationData?.rawFifoSuggestions ||
        fifoSuggestionsMap[item.productId] ||
        [];

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
            batchId: suggestion.batchId,
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

    await handoverItems.mutateAsync({ ticketId: numericId, items: payload });
  };

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
        subtitle={order?.note || `OUT-${order?.id}`}
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
        <OutboundInfoCard
          statusLabel={statusConfig.label}
          statusColor={statusConfig.color}
          statusBgColor={statusConfig.bgColor}
          createdBy={
            order.createdByUser?.fullName ||
            order.createdByUser?.email ||
            order.createdByNavigation?.email ||
            t('common.notAvailable')
          }
          destination={order.destination || t('common.notAvailable')}
        />

        <OutboundMapShortcut
          onPress={() => {
            router.push({
              pathname: "/warehouse-view",
              params: {
                warehouseId: String(order.warehouse?.id || order.warehouseId || ""),
                outboundOrderId: String(order.id),
                status: "path_optimization",
              },
            } as any);
          }}
        />

        <View className="flex-row justify-between items-end mb-3 mt-2">
          <Text className="text-base font-bold text-slate-800">
            {t("outbound.productList")}
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textMuted }}>
            {(order.items || order.outboundOrderItems)?.length ?? 0}{" "}
            {t("common.items")}
          </Text>
        </View>

        {sortedItems.map((item: OutboundOrderItem) => {
          const pickedLocations = (item as any).pickedLocations || (item as any).selectedPickLocations || [];
          const optimizedItem = itemsToPick?.find(it => it.productId === item.productId);
          const optimizedLocations = optimizedItem?.locationData?.rawFifoSuggestions || [];
          const rawFifoSuggestions = fifoSuggestionsMap[Number(item.productId || 0)] || [];

          const displayLocations = pickedLocations.length > 0
            ? pickedLocations
            : (optimizedLocations.length > 0 ? optimizedLocations : rawFifoSuggestions);

          return (
            <OutboundProductItem
              key={item.id}
              item={item}
              currentStatus={currentStatus}
              canEditItems={canEditItems}
              localQty={localQuantities[item.id] !== undefined ? localQuantities[item.id] : "0"}
              isFifoLoading={isFifoLoading}
              displayLocations={displayLocations}
              fifoSummary={fifoSummaryMap[Number(item.productId || 0)]}
              getLocationLabels={getLocationLabels}
              handleUpdateQty={handleUpdateQty}
              onManualQtyChange={(id, text) => {
                if (text === "") {
                  setLocalQuantities((prev) => ({ ...prev, [id]: "" }));
                  return;
                }
                const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                if (isNaN(num)) return;
                
                const productId = item.productId || 0;
                const availableInWarehouse = fifoSummaryMap[Number(productId)]?.totalAvailableQuantity;
                const requiredQty = item.quantity || 0;
                const maxQty = availableInWarehouse !== undefined ? Math.min(requiredQty, availableInWarehouse) : requiredQty;

                setLocalQuantities((prev) => ({ ...prev, [id]: Math.min(num, maxQty) }));
              }}
            />
          );
        })}
      </RefreshContainer>

      <OutboundActionFooter
        currentStatus={currentStatus}
        isTransitioning={isTransitioning}
        isSaving={isSaving}
        showSaveBtn={showSaveBtn}
        prevAction={prevAction}
        nextAction={nextAction}
        handleRevertStatus={handleRevertStatus}
        handleSaveItems={handleSaveItems}
        handleTransition={handleTransition}
        bottomSafePadding={getBottomSafePadding(insets.bottom, 20)}
      />
    </KeyboardAvoidingView>
  );
}

