"use client";

import { useState } from "react";
import { careGuides } from "@/lib/dummy-data";
import { Plus, Search, Pencil } from "lucide-react";

export default function CareGuidesListModule() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGuides = careGuides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-1000">Care Guides</h1>
          <p className="text-sm text-neutral-700 mt-1">Manage product care instructions</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-400 transition-colors cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Care Guide
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search care guides..."
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
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Title</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-neutral-800">Instructions</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              {filteredGuides.map((guide) => (
                <tr key={guide.id} className="hover:bg-neutral-200 transition-colors">
                  <td className="px-5 py-3 font-medium text-primary-1000">{guide.title}</td>
                  <td className="px-5 py-3 text-neutral-800 max-w-md truncate">
                    {guide.instructions
                      ? Object.entries(guide.instructions)
                          .map(([key, value]) => `${key}: ${String(value)}`)
                          .join(" | ")
                      : "-"}
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
              {filteredGuides.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-neutral-700">
                    No care guides found
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


