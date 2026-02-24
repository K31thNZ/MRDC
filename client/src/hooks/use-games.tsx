import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertGame } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useGames() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const gamesQuery = useQuery({
    queryKey: [api.games.list.path],
    queryFn: async () => {
      const res = await fetch(api.games.list.path);
      if (!res.ok) throw new Error("Failed to fetch games");
      return await res.json();
    },
  });

  const createGameMutation = useMutation({
    mutationFn: async (game: InsertGame) => {
      const res = await fetch(api.games.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(game),
      });
      if (!res.ok) throw new Error("Failed to create game");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.games.list.path] });
      toast({ title: "Success", description: "Game added to library" });
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertGame> }) => {
      const res = await fetch(buildUrl(api.games.update.path, { id }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update game");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.games.list.path] });
      toast({ title: "Success", description: "Game updated" });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.games.delete.path, { id }), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete game");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.games.list.path] });
      toast({ title: "Success", description: "Game deleted" });
    },
  });

  return {
    games: gamesQuery.data,
    isLoading: gamesQuery.isLoading,
    createGame: createGameMutation,
    updateGame: updateGameMutation,
    deleteGame: deleteGameMutation,
  };
}

import { buildUrl } from "@shared/routes";
