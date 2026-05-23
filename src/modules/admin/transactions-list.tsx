"use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/status-badge";
import { transactions, formatPrice, formatDateTime } from "@/lib/dummy-data";
import { cn } from "@/lib/utils";
import { Search, Eye } from "lucide-react";

export default function TransactionsListModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled">("all");

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.courierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Transactions</h1>
          <p className="text-sm text-neutral-700 mt-1">Manage customer orders and transactions</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer",
                statusFilter === status
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-200">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Order ID</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Items</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Total</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Courier</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Shipping</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Status</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Date</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-200 transition-colors">
                  <td className="px-5 py-3 font-medium text-primary-1000">{tx.orderId}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary-1000">{tx.user.name}</span>
                      <span className="text-xs text-neutral-700">{tx.user.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-800">{tx.items.length} item(s)</td>
                  <td className="px-5 py-3 text-right font-medium text-primary-1000">{formatPrice(tx.totalAmount)}</td>
                  <td className="px-5 py-3 text-neutral-800 text-xs">{tx.courierName} / {tx.courierService}</td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={tx.shippingStatus} variant="order" />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={tx.status} variant="order" />
                  </td>
                  <td className="px-5 py-3 text-neutral-700 text-xs">{formatDateTime(tx.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg p-1.5 text-neutral-700 hover:bg-neutral-300 hover:text-primary-1000 transition-colors cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-neutral-700">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


