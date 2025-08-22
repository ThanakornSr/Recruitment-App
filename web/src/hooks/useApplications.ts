import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export const useApplications = (status?: string) => {
  return useQuery({
    queryKey: ['applications', status],
    queryFn: () => 
      api.get('/admin/applications' + (status ? `?status=${status}` : '')),
  });
};

export const useApplication = (id: string) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/admin/applications/${id}`),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FormData) => 
      api.post('/applications', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.put(`/admin/applications/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.put(`/admin/applications/${id}/status`, { status, notes }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
  });
};
