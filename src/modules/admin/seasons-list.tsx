"use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/status-badge";
import { seasons } from "@/lib/dummy-data";
import { Plus, Search, Pencil } from "lucide-react";

export default function SeasonsListModule() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSeasons = seasons.filter(
    (season) =>
      season.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      season.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      season.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Seasons</h1>
          <p className="text-sm text-neutral-700 mt-1">Manage product seasons and collections</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-400 transition-colors cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Season
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search seasons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-100 py-2.5 pl-10 pr-4 text-sm text-primary-1000 placeholder:text-neutral-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="rounded-xl border border-neutral-300 bg-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-200">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Name</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Subtitle</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Description</th>
                <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-neutral-800">Status</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {filteredSeasons.map((season) => (
                <tr key={season.id} className="hover:bg-neutral-200 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-primary-1000">{season.name}</span>
                      <span className="text-xs text-neutral-700">{season.slug}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-neutral-800">{season.subtitle}</td>
                  <td className="px-5 py-3 text-neutral-800 max-w-xs truncate">{season.description}</td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={season.isActive ? "Active" : "Inactive"} variant="season" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="rounded-lg p-1.5 text-neutral-700 hover:bg-neutral-300 hover:text-primary-1000 transition-colors cursor-pointer">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSeasons.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-neutral-700">
                    No seasons found
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


