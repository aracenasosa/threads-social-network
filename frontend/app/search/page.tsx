"use client";

import { useState } from "react";
import { debounce } from "lodash";
import { useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { SearchUserCard } from "@/components/search/search-user-card";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const handleDebouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 500),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleDebouncedSearch(value);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", "search", debouncedQuery],
    queryFn: () => userService.searchUsers(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main
        className="flex-1 flex flex-col max-w-2xl mx-auto border-x border-border overflow-hidden mt-10 rounded-4xl h-[calc(100vh-40px)] bg-card"
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between sticky top-0 bg-card border-b border-border z-10">
          <div className="w-10" /> {/* Spacer for centering */}
          <h1 className="text-lg font-bold text-foreground">Search</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Search Input */}
        <div className="px-4 pb-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            </div>
            <input
              type="text"
              className="w-full bg-muted text-foreground rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-ring border border-border placeholder-muted-foreground"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar mt-2">
          {debouncedQuery ? (
            // Search Results
            <div className="pb-20">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : isError ? (
                <div className="p-8 text-center text-red-400">Error searching users</div>
              ) : data?.users && data.users.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.users.map((user) => (
                    <SearchUserCard key={user.id} user={user} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No results found for "{debouncedQuery}"</div>
              )}
            </div>
          ) : (
            // Default View / Suggestions
            <div className="px-4 py-4">
              <h2 className="text-foreground font-semibold mb-4">Follow suggestions</h2>
              {/* Could load random users or popular users here */}
              <div className="text-muted-foreground text-sm">
                Type something to search for users...
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
