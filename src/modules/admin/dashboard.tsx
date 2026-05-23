"use client";

import StatCard from "@/components/admin/stat-card";
import StatusBadge from "@/components/admin/status-badge";
import { stats, transactions, dailySales, formatPrice, formatDateTime } from "@/lib/dummy-data";
import Link from "next/link";
import { DollarSign, Receipt, Package, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardModule() {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-primary-1000">Dashboard</h1>
        <p className="text-sm text-neutral-700 mt-1">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          change="+12% from last month"
          changeType="positive"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          change="+5 new today"
          changeType="positive"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          change={`${stats.outOfStockProducts} out of stock`}
          changeType={stats.outOfStockProducts > 0 ? "negative" : "neutral"}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title="Active Seasons"
          value={stats.activeSeasons}
          change="Currently running"
          changeType="neutral"
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
            <h2 className="text-base font-bold text-primary-1000">Recent Transactions</h2>
            <Link
              href="/admin/transactions"
              className="text-sm font-medium text-primary-700 hover:text-primary-1000 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-neutral-300">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-primary-1000">{tx.orderId}</span>
                  <span className="text-xs text-neutral-700">{tx.user.name}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-medium text-primary-1000">{formatPrice(tx.totalAmount)}</span>
                  <StatusBadge status={tx.status} variant="order" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl justify-center border border-neutral-300 bg-neutral-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-primary-1000">Sales Overview</h2>
              <p className="text-xs text-neutral-700 mt-0.5">Last 7 days revenue</p>
            </div>
            <span className="text-sm font-bold text-primary-700">
              {formatPrice(dailySales.reduce((sum, d) => sum + d.revenue, 0))}
            </span>
          </div>
          <div className="px-2 py-10 ">
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4085F2" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4085F2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#737373", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#737373", fontSize: 11 }}
                    width={55}
                    domain={["auto", "auto"]}
                    tickCount={5}
                    tickFormatter={(value: number) => {
                      if (value === 0) return "0";
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                      return `${(value / 1000).toFixed(0)}rb`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E5E5",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => {
                      const num = typeof value === "number" ? value : 0;
                      return [formatPrice(num), "Revenue"];
                    }}
                    labelStyle={{ color: "#171717", fontWeight: 600, marginBottom: "4px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4085F2"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-300 px-5 py-4">
          <h2 className="text-base font-bold text-primary-1000">Pending Transactions</h2>
          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-200">
            {stats.pendingTransactions}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-200">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Order ID</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Date</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Amount</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {transactions
                .filter((t) => t.status === "pending")
                .map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-200 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary-1000">{tx.orderId}</td>
                    <td className="px-5 py-3 text-neutral-800">{tx.user.name}</td>
                    <td className="px-5 py-3 text-neutral-700">{formatDateTime(tx.createdAt)}</td>
                    <td className="px-5 py-3 text-right font-medium text-primary-1000">{formatPrice(tx.totalAmount)}</td>
                    <td className="px-5 py-3 text-center">
                      <StatusBadge status={tx.status} variant="order" />
                    </td>
                  </tr>
                ))}
              {transactions.filter((t) => t.status === "pending").length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-neutral-700">
                    No pending transactions
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


