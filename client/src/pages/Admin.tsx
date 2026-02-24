import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";
import { useGames } from "@/hooks/use-games";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEventSchema, insertGameSchema } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, CheckCircle, ThumbsUp, ThumbsDown, Clock, Users as UsersIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { useState } from "react";
import { Edit2, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, apiRequest, queryClient } from "@/lib/queryClient";

export default function Admin() {
  const { user } = useAuth();
  const { events, createEvent, deleteEvent, updateEvent } = useEvents();
  const { games, createGame, updateGame, deleteGame } = useGames();
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [attendanceEventId, setAttendanceEventId] = useState<number | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);

  const { data: reservations } = useQuery({
    queryKey: ["/api/events", attendanceEventId, "reservations"],
    enabled: !!attendanceEventId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/events/${attendanceEventId}/reservations`);
      return res.json();
    }
  });

  const completeEventMutation = useMutation({
    mutationFn: async ({ id, attendeeIds }: { id: number; attendeeIds: number[] }) => {
      await apiRequest("PATCH", `/api/events/${id}`, { isCompleted: true, attendeeIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setAttendanceEventId(null);
      setSelectedAttendees([]);
    },
  });

  const handleCompleteClick = (event: any) => {
    if (event.isCompleted) return;
    setAttendanceEventId(event.id);
    setSelectedAttendees([]);
  };

  const toggleAttendee = (userId: number) => {
    setSelectedAttendees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/games/suggestions"],
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      await apiRequest("PATCH", `/api/games/suggestions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games/suggestions"] });
    },
  });

  // Protect route
  if (!user || user.role !== 'admin') {
     return <div className="p-8 text-center text-destructive">Access Denied</div>;
  }

  // Event Form
  const eventForm = useForm({
    resolver: zodResolver(insertEventSchema.extend({
        date: z.coerce.date()
    })),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      maxSeats: 10,
      date: new Date(),
      gameId: null,
    }
  });

  // Game Form
  const gameForm = useForm({
    resolver: zodResolver(insertGameSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      minPlayers: 2,
      maxPlayers: 4,
    }
  });

  const onEventSubmit = (data: any) => {
    if (editingEventId) {
      updateEvent.mutate({ id: editingEventId, data }, {
        onSuccess: () => {
          eventForm.reset();
          setEditingEventId(null);
        }
      });
    } else {
      createEvent.mutate(data, {
          onSuccess: () => eventForm.reset()
      });
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEventId(event.id);
    // Format the date for the datetime-local input
    const date = new Date(event.date);
    // Ensure the date is in the local timezone format YYYY-MM-DDThh:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

    eventForm.reset({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      maxSeats: event.maxSeats || 10,
      date: date, // Keep as Date object for the form state
      gameId: event.gameId || null,
    });
  };

  const cancelEditEvent = () => {
    setEditingEventId(null);
    eventForm.reset({
      title: "",
      description: "",
      location: "",
      maxSeats: 10,
      date: new Date(),
      gameId: null,
    });
  };

  const onGameSubmit = (data: any) => {
    if (editingGameId) {
      updateGame.mutate({ id: editingGameId, data }, {
        onSuccess: () => {
          gameForm.reset();
          setEditingGameId(null);
        }
      });
    } else {
      createGame.mutate(data, {
          onSuccess: () => gameForm.reset()
      });
    }
  };

  const handleEditGame = (game: any) => {
    setEditingGameId(game.id);
    gameForm.reset({
      title: game.title,
      description: game.description || "",
      imageUrl: game.imageUrl || "",
      minPlayers: game.minPlayers || 2,
      maxPlayers: game.maxPlayers || 4,
    });
  };

  const cancelEdit = () => {
    setEditingGameId(null);
    gameForm.reset({
      title: "",
      description: "",
      imageUrl: "",
      minPlayers: 2,
      maxPlayers: 4,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="events">
        <TabsList className="mb-8">
          <TabsTrigger value="events">Manage Events</TabsTrigger>
          <TabsTrigger value="games">Manage Games</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Create Event */}
                <Card>
                    <CardHeader>
                        <CardTitle>{editingEventId ? "Edit Event" : "Create New Event"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...eventForm}>
                            <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4">
                                <FormField control={eventForm.control} name="title" render={({field}) => (
                                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={eventForm.control} name="description" render={({field}) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-8">
                                        <FormField control={eventForm.control} name="date" render={({field}) => (
                                            <FormItem><FormLabel>Date & Time</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value ? (field.value instanceof Date ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : new Date(new Date(field.value).getTime() - new Date(field.value).getTimezoneOffset() * 60000).toISOString().slice(0, 16)) : ""} onChange={(e) => field.onChange(new Date(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="col-span-4">
                                        <FormField control={eventForm.control} name="maxSeats" render={({field}) => (
                                            <FormItem><FormLabel>Seats</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </div>
                                <FormField control={eventForm.control} name="location" render={({field}) => (
                                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={eventForm.control} name="gameId" render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Fixed Game (Optional)</FormLabel>
                                        <Select 
                                            onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))} 
                                            value={field.value?.toString() || "none"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a game" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No fixed game (allow nominations)</SelectItem>
                                                {games?.map((game: any) => (
                                                    <SelectItem key={game.id} value={game.id.toString()}>
                                                        {game.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">If set, members cannot nominate other games for this event.</p>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="flex gap-2">
                                  <Button type="submit" className="flex-1" disabled={createEvent.isPending || updateEvent.isPending}>
                                      {editingEventId ? (updateEvent.isPending ? "Updating..." : "Update Event") : (createEvent.isPending ? "Creating..." : "Create Event")}
                                  </Button>
                                  {editingEventId && (
                                    <Button type="button" variant="outline" onClick={cancelEditEvent}>
                                      <X className="w-4 h-4 mr-2" /> Cancel
                                    </Button>
                                  )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* List Events */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xl">Existing Events</h3>
                    {events?.map((event: any) => (
                        <div key={event.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
                            <div>
                                <div className="font-bold">{event.title}</div>
                                <div className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    onClick={() => handleEditEvent(event)}
                                    title="Edit Event"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className={event.isCompleted ? "text-green-500" : "text-muted-foreground"}
                                    onClick={() => handleCompleteClick(event)}
                                    disabled={event.isCompleted}
                                    title={event.isCompleted ? "Event Completed" : "Mark Completed & Verify Attendance"}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    onClick={() => deleteEvent.mutate(event.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TabsContent>

        <TabsContent value="games">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{editingGameId ? "Edit Game" : "Add Game to Library"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...gameForm}>
                            <form onSubmit={gameForm.handleSubmit(onGameSubmit)} className="space-y-4">
                                <FormField control={gameForm.control} name="title" render={({field}) => (
                                    <FormItem><FormLabel>Game Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={gameForm.control} name="description" render={({field}) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={gameForm.control} name="imageUrl" render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Image URL (Unsplash)</FormLabel>
                                        <FormControl><Input placeholder="https://images.unsplash.com/..." {...field} value={field.value || ""} /></FormControl>
                                        <p className="text-xs text-muted-foreground">Optional</p>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={gameForm.control} name="minPlayers" render={({field}) => (
                                        <FormItem><FormLabel>Min Players</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={gameForm.control} name="maxPlayers" render={({field}) => (
                                        <FormItem><FormLabel>Max Players</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit" className="flex-1" disabled={createGame.isPending || updateGame.isPending}>
                                      {editingGameId ? (updateGame.isPending ? "Updating..." : "Update Game") : (createGame.isPending ? "Adding..." : "Add Game")}
                                  </Button>
                                  {editingGameId && (
                                    <Button type="button" variant="outline" onClick={cancelEdit}>
                                      <X className="w-4 h-4 mr-2" /> Cancel
                                    </Button>
                                  )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="font-bold text-xl">Existing Games</h3>
                    {games?.map((game: any) => (
                        <div key={game.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
                            <div>
                                <div className="font-bold">{game.title}</div>
                                <div className="text-xs text-muted-foreground">{game.minPlayers}-{game.maxPlayers} players</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    onClick={() => handleEditGame(game)}
                                    title="Edit Game"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    onClick={() => deleteGame.mutate(game.id)}
                                    title="Delete Game"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TabsContent>

        <TabsContent value="suggestions">
          {/* ... existing suggestions content ... */}
        </TabsContent>
      </Tabs>

      <Dialog open={!!attendanceEventId} onOpenChange={(open) => !open && setAttendanceEventId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Attendance</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select members who physically attended the event. Each selected member will receive 1 Dice point.
            </p>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {reservations?.filter((r: any) => r.status === "confirmed").map((res: any) => (
                <div key={res.userId} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox 
                    id={`attendee-${res.userId}`} 
                    checked={selectedAttendees.includes(res.userId)}
                    onCheckedChange={() => toggleAttendee(res.userId)}
                  />
                  <label 
                    htmlFor={`attendee-${res.userId}`}
                    className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {res.user.username}
                  </label>
                </div>
              ))}
              {reservations?.filter((r: any) => r.status === "confirmed").length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No confirmed reservations for this event.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceEventId(null)}>Cancel</Button>
            <Button 
              onClick={() => attendanceEventId && completeEventMutation.mutate({ id: attendanceEventId, attendeeIds: selectedAttendees })}
              disabled={completeEventMutation.isPending}
            >
              {completeEventMutation.isPending ? "Processing..." : "Confirm & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
