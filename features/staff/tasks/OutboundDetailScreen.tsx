import { RefreshContainer, ScreenHeader } from "@/components";
import { getBottomSafePadding } from "@/components/ui/safeArea";
import { COLORS } from "@/constants/color";
import {
    useOutboundTasksByStaff,
    useUpdateOutboundTicketItems,
    useUpdateOutboundTicketStatus,
} from "@/hooks";
import { useAppBack } from "@/hooks/useAppBack";
import { useTranslation } from "@/hooks/useTranslation";
import { AlertService } from "@/stores/alert.store";
import { useAuthStore } from "@/stores/auth.store";
import type { OutboundOrderItem } from "@/types/outbound-order";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
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
      label: t('common.pending'),
      color: COLORS.warning,
      bgColor: COLORS.warning + "20",
    },
    Picking: {
      label: t('tasks.pickItems'),
      color: COLORS.primary,
      bgColor: COLORS.primaryLight + "20",
    },
    QualityCheck: {
      label: t('outbound.qualityCheck'),
      color: "#7C3AED",
      bgColor: "#7C3AED20",
    },
    IssueReported: {
      label: t('outbound.issue'),
      color: COLORS.danger,
      bgColor: COLORS.danger + "20",
    },
    Packing: { label: t('outbound.packing'), color: COLORS.teal600, bgColor: COLORS.teal50 },
    LoadHandover: {
      label: t('common.pending'),
      color: COLORS.warning,
      bgColor: COLORS.warning + "20",
    },
    Completed: {
      label: t('common.done'),
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
          label: t('outbound.startPicking'),
          nextStatus: "Picking",
          color: COLORS.primary,
        };
      case "Picking":
        return {
          label: t('outbound.finishPicking'),
          nextStatus: "QualityCheck",
          color: "#7C3AED",
        };
      case "QualityCheck":
        return {
          label: t('outbound.passAndPack'),
          nextStatus: "Packing",
          color: COLORS.teal600,
        };
      case "IssueReported":
        return {
          label: t('outbound.resolved'),
          nextStatus: "Packing",
          color: COLORS.teal600,
        };
      case "Packing":
        return {
          label: t('outbound.complete'),
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
          label: t('common.undo'),
          prevStatus: "Created",
          color: COLORS.textMuted,
        };
      case "QualityCheck":
        return {
          label: t('common.back'),
          prevStatus: "Picking",
          color: COLORS.textMuted,
        };
      case "IssueReported":
        return {
          label: t('common.cancel'),
          prevStatus: "QualityCheck",
          color: COLORS.textMuted,
        };
      case "Packing":
        return {
          label: t('common.back'),
          prevStatus: "QualityCheck",
          color: COLORS.textMuted,
        };
      default:
        return null;
    }
  };
  const companyId = user?.companyId ?? 0;
  const staffId = user?.id ?? 0;

  const { data: staffTasks, isLoading, refetch } = useOutboundTasksByStaff(
    companyId,
    staffId,
  );
  const numericId = typeof id === "string" ? parseInt(id, 10) : id;
  const order = staffTasks?.find((t) => t.id === numericId) ?? null;
  const error = !isLoading && !order;

  const updateItems = useUpdateOutboundTicketItems();
  const updateStatus = useUpdateOutboundTicketStatus();

  const [localQuantities, setLocalQuantities] = useState<Record<number, any>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ===== ADDED CODE START =====
  const [optimizedPath, setOptimizedPath] = useState<string[]>([]);
  const [itemsToPick, setItemsToPick] = useState<any[]>([]);
  // ===== ADDED CODE END =====

  const currentStatus = (order?.status as TicketStatus) || "Created";
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Created;
  const nextAction = getNextAction(currentStatus);
  const prevAction = getPreviousAction(currentStatus);

  const canEditItems =
    currentStatus !== "Created" &&
    currentStatus !== "LoadHandover" &&
    currentStatus !== "Completed";

  const canReportIssue = currentStatus === "QualityCheck";

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
        const response = await fetch(
          `https://storix-docker.onrender.com/api/InventoryOutbound/tickets/${numericId}/path-optimization`,
        );
        if (!response.ok) return;

        const responseData = await response.json();
        const payloadData = responseData?.payload?.[0];

        if (payloadData && payloadData.status === "success") {
          setOptimizedPath(payloadData.fullOptimizedPath || []);
          setItemsToPick(payloadData.itemsToPick || []);
        }
      } catch (err) {
        console.log("Failed to fetch path optimization:", err);
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
        <ScreenHeader title={t('common.loading')} />
      </View>
    );
  }

  if (!order || error) {
    return (
      <View className="flex-1 bg-slate-50">
        <ScreenHeader title={t('common.error')} />
        <View className="flex-1 justify-center items-center p-5">
          <Feather name="alert-circle" size={48} color={COLORS.danger} />
          <Text
            className="text-base mt-3 mb-6 text-center"
            style={{ color: COLORS.textMuted }}
          >
            {t('common.noData')}
          </Text>
          <TouchableOpacity
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: COLORS.primary }}
            onPress={goBack}
          >
            <Text className="text-white font-bold">{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleUpdateQty = (itemId: number, increment: boolean) => {
    if (!canEditItems) {
      AlertService.warning(
        t('outbound.cannotEdit'),
        t('outbound.cannotEditMsg'),
      );
      return;
    }
    setLocalQuantities((prev) => {
      const current = Number(prev[itemId]) || 0;
      const orderItems = order?.items || order?.outboundOrderItems || [];
      const item = orderItems.find((i: OutboundOrderItem) => i.id === itemId);
      const maxQty = item?.quantity || 9999;
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

      AlertService.success(t('common.success'), t('warehouse.recordedSuccessfully'));
    } catch (error) {
      console.error("Save Items Error:", error);
      AlertService.error(t('common.error'), t('common.failed'));
    } finally {
      setIsSaving(false);
    }
  };

  // ===== ADDED CODE START =====
  // FEATURE 2: HANDLE PACKING -> HANDOVER
  const handleHandover = async () => {
    if (!numericId || !itemsToPick || itemsToPick.length === 0) return;

    try {
      const payload = itemsToPick.map((item) => ({
        id: item.id,
        productId: item.productId,
        expectedQuantity: item.quantityToPick,
        receivedQuantity:
          localQuantities[item.id] !== undefined
            ? Number(localQuantities[item.id])
            : item.quantityToPick,
        locations: (item.locationData?.availableBins || []).map((bin: any) => ({
          binId: bin.binIdCode,
          quantity: item.quantityToPick,
        })),
      }));

      const response = await fetch(
        `https://storix-docker.onrender.com/api/InventoryOutbound/tickets/${numericId}/items`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        console.log("Failed to update items during handover");
      }
    } catch (err) {
      console.log("Handover API error:", err);
    }
  };
  // ===== ADDED CODE END =====

  const handleTransition = async () => {
    if (!order || !user || !nextAction) return;

    const executeTransition = async () => {
      setIsTransitioning(true);
      try {
        // ===== ADDED CODE START =====
        if (nextAction.nextStatus === "LoadHandover") {
          await handleHandover();
        }
        // ===== ADDED CODE END =====

        await updateStatus.mutateAsync({
          ticketId: order.id,
          performedBy: user.id || 0,
          status: nextAction.nextStatus,
        });

        AlertService.success(
          t('common.success'),
          `${t('tasks.status')}: ${STATUS_CONFIG[nextAction.nextStatus].label}`,
        );
      } catch (error) {
        console.error(error);
        AlertService.error(t('common.error'), t('common.failed'));
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
        ? t('outbound.handoverMsg')
        : `${t('common.confirm')} "${STATUS_CONFIG[nextAction.nextStatus].label}"?`;

    AlertService.confirm(nextAction.label, confirmMsg, executeTransition);
  };

  const handleRevertStatus = () => {
    if (!order || !user || !prevAction) return;

    AlertService.confirm(
      t('common.undo'),
      t('outbound.revertConfirm', { status: STATUS_CONFIG[prevAction.prevStatus].label }),
      async () => {
        setIsTransitioning(true);
        try {
          await updateStatus.mutateAsync({
            ticketId: order.id,
            performedBy: user.id || 0,
            status: prevAction.prevStatus,
          });

          AlertService.success(
            t('common.success'),
            t('outbound.revertSuccess', { status: STATUS_CONFIG[prevAction.prevStatus].label }),
          );
        } catch {
          AlertService.error(t('common.error'), t('outbound.revertFailedMsg'));
        } finally {
          setIsTransitioning(false);
        }
      },
    );
  };

  const handleReportIssue = async () => {
    if (!order || !user || !canReportIssue) return;

    AlertService.confirm(
      t('outbound.reportIssue'),
      t('outbound.issueMsg'),
      async () => {
        setIsTransitioning(true);
        try {
          await updateStatus.mutateAsync({
            ticketId: order.id,
            performedBy: user.id || 0,
            status: "IssueReported",
          });
          AlertService.success(
            t('outbound.issue'),
            t('outbound.reportIssueSuccess'),
          );
        } catch {
          AlertService.error(t('common.error'), t('outbound.reportIssueFailedMsg'));
        } finally {
          setIsTransitioning(false);
        }
      },
    );
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={t('outbound.ticketTitle')}
        subtitle={order.note || `OUT-${order.id}`}
      />

      <RefreshContainer
        onRefresh={async () => { await refetch(); }}
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
              {t('tasks.status')}:
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
              {t('tasks.createdBy')}:{" "}
              <Text className="font-semibold text-slate-800">
                {order.createdByUser?.fullName ||
                  order.createdByUser?.email ||
                  order.createdByNavigation?.email ||
                  "N/A"}
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
              {t('tasks.destination')}:{" "}
              <Text className="font-semibold text-slate-800">
                {order.destination || "N/A"}
              </Text>
            </Text>
          </View>
        </View>

        {/* Warehouse Location Shortcut - CHỈ HIỂN THỊ Ở CREATED & PICKING */}
        {(currentStatus === "Created" || currentStatus === "Picking") && (
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
                {t('outbound.warehouseMap')}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: COLORS.textMuted }}
              >
                {t('outbound.tapToNavigate')}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        <View className="flex-row justify-between items-end mb-3 mt-2">
          <Text className="text-base font-bold text-slate-800">
            {t('outbound.productList')}
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textMuted }}>
            {(order.items || order.outboundOrderItems)?.length ?? 0} {t('tabs.tasks').toLowerCase()}
          </Text>
        </View>

        {/* Item Cards */}
        {sortedItems.map((item: OutboundOrderItem) => {
          console.log("Check item data: ", item);
          return (
            <View
              key={item.id}
              className="mb-3 bg-white p-4 rounded-xl shadow-sm"
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-slate-800 mb-1.5">
                    {item.productName ||
                      item.name ||
                      item.product?.name ||
                      `${t('common.product')} #${item.productId}`}
                  </Text>
                  <View className="flex-row flex-wrap">
                    <View className="bg-slate-100 px-2 py-1 rounded">
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: COLORS.textMuted }}
                      >
                        {item.sku || item.product?.sku || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>

                {currentStatus !== "Created" && (
                  <View
                    className="px-2 py-1 rounded-md"
                    style={{
                      backgroundColor:
                        (Number(localQuantities[item.id]) || 0) >=
                        (item.quantity || 0)
                          ? COLORS.success + "20"
                          : COLORS.warning + "20",
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color:
                          (Number(localQuantities[item.id]) || 0) >=
                          (item.quantity || 0)
                            ? COLORS.success
                            : COLORS.warning,
                      }}
                    >
                      {(Number(localQuantities[item.id]) || 0) >=
                      (item.quantity || 0)
                        ? t('common.done')
                        : t('common.pending')}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between items-center mt-2 border-t border-slate-50 pt-3">
                <Text className="text-sm font-medium text-slate-700">
                  {currentStatus === "Created"
                    ? t('outbound.itemQty')
                    : currentStatus === "Picking"
                      ? t('outbound.pickedQty')
                      : t('outbound.readyQty')}
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

                          const maxQty = item.quantity || 9999;
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
                            color:
                              currentStatus === "Completed"
                                ? COLORS.success
                                : COLORS.primary,
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
            </View>
          );
        })}
      </RefreshContainer>

      {/* Bottom Footer */}
      <View
        className="p-5 bg-white flex-row items-center border-t border-slate-200"
        style={{ paddingBottom: getBottomSafePadding(insets.bottom, 20) }}
      >
        {canReportIssue && (
          <TouchableOpacity
            className={`w-14 h-14 rounded-xl border justify-center items-center mr-3 ${
              isTransitioning ? "opacity-60" : ""
            }`}
            style={{
              borderColor: COLORS.danger + "30",
              backgroundColor: COLORS.danger + "05",
            }}
            onPress={handleReportIssue}
            disabled={isTransitioning}
          >
            <Feather name="alert-triangle" size={20} color={COLORS.danger} />
            <Text
              className="text-[10px] font-bold mt-1"
              style={{ color: COLORS.danger }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('outbound.issue')}
            </Text>
          </TouchableOpacity>
        )}

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
              {isSaving ? t('common.loading') : t('common.save')}
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
              {t('outbound.awaitingApproval')}
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
              {t('outbound.orderCompleted')}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
