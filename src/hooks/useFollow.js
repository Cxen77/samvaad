import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const useFollow = (targetId) => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.put(`/users/${targetId}/follow`);
            return data;
        },
        onSuccess: (data) => {
            // Invalidate current user data (their 'following' list changed)
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            
            // Invalidate the specific profile being viewed (their 'followers' list changed)
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            
            // Invalidate dynamic recommendations
            queryClient.invalidateQueries({ queryKey: ['recommendedUsers'] });
            queryClient.invalidateQueries({ queryKey: ['homeData'] });

            toast.success(data.message || 'Updated following status');
        },
        onError: (error) => {
            console.error('Follow error:', error);
            toast.error(error.response?.data?.message || 'Failed to update following status');
        }
    });

    return {
        follow: mutation.mutate,
        isPending: mutation.isPending
    };
};
