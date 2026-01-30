import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { postService } from "@/services/post.service";
import { FeedResponse } from "@/shared/types/post.types";
import { QUERY_KEYS } from "@/shared/lib/query-keys";

export const useFeed = (
  limit: number = 10,
  authorId?: string,
  filterType?: string,
  isLikedFeed: boolean = false,
) => {
  const params = useMemo(
    () => ({ limit, authorId, filterType, isLikedFeed }),
    [limit, authorId, filterType, isLikedFeed],
  );

  return useInfiniteQuery<FeedResponse, Error>({
    queryKey: QUERY_KEYS.feed(params),
    queryFn: ({ pageParam }) =>
      isLikedFeed
        ? postService.getLikedPosts(limit, pageParam as string | undefined)
        : postService.getFeed(
            limit,
            pageParam as string | undefined,
            authorId,
            filterType,
          ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData, previousQuery) => {
      // Only keep previous data if we are loading the SAME type of feed
      const prevParams = previousQuery?.queryKey[1] as any;
      const isSameFeedType =
        prevParams?.filterType === filterType &&
        prevParams?.authorId === authorId &&
        prevParams?.isLikedFeed === isLikedFeed;

      return isSameFeedType ? keepPreviousData(previousData) : undefined;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
