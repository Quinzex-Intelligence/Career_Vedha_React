import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService } from '../services';

export const topStoryKeys = {
    all: ['top-stories'],
    list: (params) => [...topStoryKeys.all, 'list', params],
    detail: (id) => [...topStoryKeys.all, 'detail', id],
};

export function useTopStories(params = {}, options = {}) {
    return useQuery({
        queryKey: topStoryKeys.list(params),
        queryFn: () => newsService.getTopStoriesList(params),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useCreateTopStory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => newsService.createTopStory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: topStoryKeys.all });
        },
    });
}

export function useUpdateTopStory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => newsService.updateTopStory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: topStoryKeys.all });
        },
    });
}

export function useDeleteTopStory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => newsService.deleteTopStory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: topStoryKeys.all });
        },
    });
}
