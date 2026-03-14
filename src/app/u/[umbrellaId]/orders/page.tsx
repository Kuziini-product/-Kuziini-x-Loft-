"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, Truck, ChefHat, XCircle } from "lucide-react";
import { PageHeader, EmptyState, Spinner } from "@/components/ui";
import { useSessionStore } from "@/store";
import { formatPrice, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  sent: <Clock className="w-4 h-4" />,
  confirmed: <CheckCircle2 className="w-4 h-4" />,
  preparing: <ChefHat className="w-4 h-4" />,
  delivering: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle2 className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

export default function OrdersPage({ params }: { params: { umbrellaId: string } }) {
  const { umbrellaId } = params;
  const { userSession, orders: localOrders } = useSessionStore();

  const allOrders = localOrders;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["orders", umbrellaId, userSession?.phone],
    queryFn: async () => {
      const url = `/api/orders?umbrellaId=${umbrellaId}${userSession ? `&phone=${userSession.phone}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.data?.orders as Order[];
    },
    enabled: !!userSession,
    refetchInterval: 15000,
  });

  const remoteOrders = data ?? [];

  const mergedMap = new Map<string, Order>();
  remoteOrders.forEach((o) => mergedMap.set(o.id, o));
  allOrders.forEach((o) => {
    if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
  });
  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!userSession) {
    return (
      <div>
        <PageHeader
          title="Comenzile mele"
          back={
            <Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10">
              <ArrowLeft className="w-4 h-4 text-white/70" />
            </Link>
          }
        />
        <EmptyState
          icon="🔐"
          title="Identificare necesară"
          description="Identifică-te pentru a vedea comenzile tale."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Comenzile mele"
        subtitle={`Umbrela ${umbrellaId}`}
        back={
          <Link href={`/u/${umbrellaId}`} className="w-9 h-9 flex items-center justify-center bg-white/10">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </Link>
        }
        right={
          <button
            onClick={() => refetch()}
            className={cn("w-9 h-9 flex items-center justify-center bg-white/10", isFetching && "animate-spin")}
          >
            <RefreshCw className="w-4 h-4 text-white/50" />
          </button>
        }
      />

      <div className="px-4 py-4">
        {isLoading && merged.length === 0 ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : merged.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="Nicio comandă încă"
            description="Comenzile tale vor apărea aici după plasare."
            action={
              <Link href={`/u/${umbrellaId}/menu`}>
                <button className="px-6 py-3 bg-[#C9AB81] text-[#0A0A0A] font-bold text-xs tracking-[0.15em] uppercase">
                  Vezi meniul
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {merged.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusColors: Record<OrderStatus, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    sent: "bg-[#C9AB81]/20 text-[#C9AB81]",
    confirmed: "bg-[#C9AB81]/20 text-[#C9AB81]",
    preparing: "bg-amber-500/20 text-amber-400",
    delivering: "bg-purple-500/20 text-purple-400",
    delivered: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-red-500/20 text-red-400",
    cancelled: "bg-white/10 text-white/40",
  };

  const isActive = !["delivered", "rejected", "cancelled"].includes(order.status);

  return (
    <div className={cn("bg-white/[0.03] border overflow-hidden", isActive ? "border-[#C9AB81]/30" : "border-white/[0.06]")}>
      {/* Status bar */}
      {isActive && (
        <div className="h-0.5 bg-gradient-to-r from-[#C9AB81]/60 to-[#C9AB81] animate-pulse" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-white/30">
              {formatDate(order.createdAt)}
            </p>
            <p className="text-xs text-white/30 font-mono">
              #{order.id.slice(-6).toUpperCase()}
            </p>
          </div>
          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold tracking-wider uppercase", statusColors[order.status])}>
            {STATUS_ICONS[order.status]}
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-1.5 mb-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-white/60">
                {item.quantity}× {item.name}
              </span>
              <span className="text-white/40">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">
            {order.ownerApprovalRequired ? "⏳ Necesită aprobare owner" : ""}
          </span>
          <span className="font-bold text-[#C9AB81]">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
