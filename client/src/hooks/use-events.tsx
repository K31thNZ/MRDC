import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, insertEventSchema } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type InsertEvent = z.infer<typeof insertEventSchema>;

export function useEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const eventsQuery = useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events");
      return await res.json();
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (event: InsertEvent) => {
      const res = await fetch(api.events.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Success", description: "Event created successfully" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Deleted", description: "Event removed" });
    },
  });
  
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEvent> & { isCompleted?: boolean } }) => {
      const url = buildUrl(api.events.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Updated", description: "Event updated successfully" });
    },
  });

  const reserveMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const url = buildUrl(api.events.reserve.path, { id: eventId });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to reserve");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Reserved!", description: "See you there! 🎲" });
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const url = buildUrl(api.events.cancelReservation.path, { id: eventId });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel reservation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Cancelled", description: "Reservation cancelled." });
    },
  });

  return {
    events: eventsQuery.data,
    isLoading: eventsQuery.isLoading,
    createEvent: createEventMutation,
    deleteEvent: deleteEventMutation,
    updateEvent: updateEventMutation,
    reserve: reserveMutation,
    cancelReservation: cancelReservationMutation,
  };
}

export function useEventNominations(eventId: number) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const nominationsQuery = useQuery({
        queryKey: [api.events.getNominations.path, eventId],
        queryFn: async () => {
             const url = buildUrl(api.events.getNominations.path, { id: eventId });
             const res = await fetch(url);
             if(!res.ok) throw new Error("Failed to fetch nominations");
             return await res.json();
        },
        enabled: !!eventId
    });

    const nominateMutation = useMutation({
        mutationFn: async (gameId: number) => {
            const url = buildUrl(api.events.nominate.path, { id: eventId });
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId })
            });
            if(!res.ok) throw new Error("Failed to nominate");
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.events.getNominations.path, eventId] });
            toast({ title: "Nominated!", description: "Great choice!" });
        }
    });

    const voteMutation = useMutation({
        mutationFn: async (nominationId: number) => {
            const url = buildUrl(api.events.vote.path, { id: nominationId });
            const res = await fetch(url, { method: "POST" });
            if(!res.ok) throw new Error("Failed to vote");
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.events.getNominations.path, eventId] });
            toast({ title: "Voted!", description: "Your voice has been heard." });
        }
    });

    return {
        nominations: nominationsQuery.data,
        isLoading: nominationsQuery.isLoading,
        nominate: nominateMutation,
        vote: voteMutation
    };
}
