import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const usePosts = (feedType) => {
    const filterParam = feedType === "Following" ? "following" : "";

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isLoading,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['posts', feedType],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get(`/posts?pageNumber=${pageParam}&filter=${filterParam}`);
            return data;
        },
        getNextPageParam: (lastPage) => {
            return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
        },
        staleTime: 1000 * 60, // 1 minute stale time to prevent immediate background refetch when seeded
    });

    // Flatten pages into a single list of posts
    const posts = data?.pages.flatMap(page => page.posts.map(post => {
        // console.log(`[usePosts] Post ${post._id} has attachedTeam:`, post.attachedTeam);
        return {
            id: post._id,
            author: post.user?.name || "Unknown User",
            authorUsername: post.user?.username || "unknown",
            authorImg: post.user?.profilePic || null,
            authorVerified: post.user?.collegeVerified || false,
            time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Just now",
            content: post.content,
            image: post.image,
            likes: post.likes || [],
            comments: post.comments || [],
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            likedByUser: post.likedByUser || false,
            user: post.user,
            attachedTeam: post.attachedTeam,
            hasAttachedTeam: !!post.attachedTeam,
            attachedEvent: post.attachedEvent,
            hasAttachedEvent: !!post.attachedEvent
        };
    })) || [];

    return {
        posts,
        isLoading,
        fetchNextPage,
        hasNextPage: !!hasNextPage,
        isFetchingNextPage
    };
};
