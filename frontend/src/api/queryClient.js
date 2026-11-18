import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes fresh cache
      gcTime: 1000 * 60 * 20, // 20 minutes garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
