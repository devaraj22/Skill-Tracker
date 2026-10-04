import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Page } from "@/types";

type Params = Record<string, string | number | boolean | null | undefined>;

/** List query for a paginated collection. */
export function useList<T>(path: string, params: Params = {}) {
  return useQuery({ queryKey: [path, params], queryFn: () => api.get<Page<T>>(path, params), placeholderData: keepPreviousData });
}

/** Create / update / delete mutations that refresh every cached list and the dashboard afterwards. */
export function useCrud<T>(path: string) {
  const qc = useQueryClient();
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: [path] }), qc.invalidateQueries({ queryKey: ["dashboard"] }), qc.invalidateQueries({ queryKey: ["placement-summary"] })]);
  const create = useMutation({ mutationFn: (body: unknown) => api.post<T>(path, body), onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ id, body }: { id: string; body: unknown }) => api.patch<T>(`${path}/${id}`, body), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => api.del(`${path}/${id}`), onSuccess: refresh });
  return { create, update, remove, refresh };
}
