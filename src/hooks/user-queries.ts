import { userService } from "@/services/user-service";
import { useQuery } from "@tanstack/react-query";

export const USER_KEYS = {
  all: ["users"] as const,
  lists: () => [...USER_KEYS.all, "list"] as const,
  list: (params?: any) => [...USER_KEYS.lists(), params] as const,
  details: () => [...USER_KEYS.all, "detail"] as const,
  detail: (id: string) => [...USER_KEYS.details(), id] as const,
};

export function useUsers(params?: any) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn: () => userService.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => userService.getUser(id),
    enabled: !!id,
  });
}
