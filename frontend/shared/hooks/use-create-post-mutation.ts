import {
  useMutation,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { postService } from "@/services/post.service";
import { CreatePostDTO } from "@/shared/types/post-dto";
import { FeedResponse } from "@/shared/types/post.types";

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostDTO) => postService.createPost(data),
    onMutate: async (newPostDTO) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      // Snapshot previous feeds
      const previousFeeds = queryClient.getQueriesData<
        InfiniteData<FeedResponse>
      >({ queryKey: ["feed"] });

      // Create a temporary optimistic post object
      const optimisticPost: any = {
        _id: `temp-${Date.now()}`,
        text: newPostDTO.text,
        author: {
          _id: newPostDTO.author,
          userName: "you",
          fullName: "You",
          avatarUrl: "",
        }, // Simplified for preview
        media: [], // Media handling is complex for optimistic preview (Files vs URLs)
        likesCount: 0,
        repliesCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };

      // Optimistically prepend to feeds (Page 1)
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData || oldData.pages.length === 0) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page, index) =>
              index === 0
                ? { ...page, items: [optimisticPost, ...page.items] }
                : page,
            ),
          };
        },
      );

      return { previousFeeds };
    },
    onSuccess: (responseData, variables) => {
      const newPost = responseData.post;

      // Replace optimistic post with real one or just sync
      queryClient.setQueriesData<InfiniteData<FeedResponse>>(
        { queryKey: ["feed"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item._id.startsWith("temp-") && item.text === newPost.text
                  ? newPost
                  : item,
              ),
            })),
          };
        },
      );

      // If it's a thread view, we might need a separate invalidation
      if (variables.parentPost) {
        queryClient.invalidateQueries({
          queryKey: ["thread", variables.parentPost],
        });
      }
    },
    onError: (err, newPostDTO, context) => {
      // Rollback
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["feed"],
        refetchType: "none",
      });
    },
  });
};
