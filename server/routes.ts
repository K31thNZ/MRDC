
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth (Passport)
  setupAuth(app);

  // === EVENTS ===
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      const reservations = await storage.getReservationsByEvent(event.id);
      let userStatus = null;
      if (req.isAuthenticated()) {
        const myRes = await storage.getUserReservation(req.user!.id, event.id);
        if (myRes) userStatus = myRes.status;
      }
      return {
        ...event,
        attendeeCount: reservations.length,
        userReservationStatus: userStatus,
      };
    }));
    res.json(eventsWithDetails);
  });

  app.post(api.events.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const bodySchema = api.events.create.input.extend({
      date: z.coerce.date(),
    });
    const input = bodySchema.parse(req.body);
    const event = await storage.createEvent(input);
    res.status(201).json(event);
  });

  app.patch(api.events.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const bodySchema = api.events.update.input.extend({
      date: z.coerce.date().optional(),
      attendeeIds: z.array(z.number()).optional(),
    });
    const updates = bodySchema.parse(req.body);
    const { attendeeIds, ...eventUpdates } = updates;
    
    const event = await storage.updateEvent(id, eventUpdates);
    
    // Loyalty Logic: If completed, handle attendance and award dice
    if (updates.isCompleted && attendeeIds) {
      await storage.updateAttendance(id, attendeeIds);
    }
    
    res.json(event);
  });

  app.delete(api.events.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    await storage.deleteEvent(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // === RESERVATIONS ===
  app.get("/api/events/:id/reservations", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const eventId = parseInt(req.params.id);
    const reservations = await storage.getReservationsByEvent(eventId);
    res.json(reservations);
  });

  app.post(api.events.reserve.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const eventId = parseInt(req.params.id);
    const existing = await storage.getUserReservation(req.user.id, eventId);
    if (existing) return res.status(409).json({ message: "Already reserved" });
    
    const event = await storage.getEvent(eventId);
    if (!event) return res.sendStatus(404);

    const reservation = await storage.createReservation(req.user.id, eventId);
    res.json(reservation);
  });

  app.delete(api.events.cancelReservation.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const eventId = parseInt(req.params.id);
    await storage.deleteReservation(req.user.id, eventId);
    res.sendStatus(204);
  });

  // === GAME SUGGESTIONS ===
  app.post(api.games.suggest.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { title, description } = api.games.suggest.input.parse(req.body);
    const suggestion = await storage.createGameSuggestion(req.user.id, title, description);
    res.status(201).json(suggestion);
  });

  app.get(api.games.listSuggestions.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const suggestions = await storage.getGameSuggestions();
    res.json(suggestions);
  });

  app.patch(api.games.updateSuggestion.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const { status } = api.games.updateSuggestion.input.parse(req.body);
    const updated = await storage.updateGameSuggestionStatus(id, status);
    res.json(updated);
  });

  // === NOMINATIONS & VOTES ===
  app.get(api.events.getNominations.path, async (req, res) => {
    const eventId = parseInt(req.params.id);
    const nominations = await storage.getNominationsByEvent(eventId);
    
    const withUserVote = await Promise.all(nominations.map(async (n) => {
      let hasVoted = false;
      if (req.isAuthenticated()) {
        const vote = await storage.getVote(req.user!.id, n.id);
        hasVoted = !!vote;
      }
      return { ...n, hasVoted };
    }));
    
    res.json(withUserVote);
  });

  app.post(api.events.nominate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const eventId = parseInt(req.params.id);
    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.gameId) {
      return res.status(400).json({ message: "Nominations are closed because a game is already set for this event." });
    }
    const { gameId } = api.events.nominate.input.parse(req.body);
    const nomination = await storage.createNomination(req.user.id, eventId, gameId);
    res.status(201).json(nomination);
  });

  app.post(api.events.vote.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const nominationId = parseInt(req.params.id);
    const existing = await storage.getVote(req.user.id, nominationId);
    if (existing) return res.status(409).json({ message: "Already voted" });
    
    const vote = await storage.createVote(req.user.id, nominationId);
    res.json(vote);
  });

  // === GAMES ===
  app.get(api.games.list.path, async (req, res) => {
    const games = await storage.getGames();
    res.json(games);
  });

  app.post(api.games.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const input = api.games.create.input.parse(req.body);
    const game = await storage.createGame(input);
    res.status(201).json(game);
  });

  app.patch(api.games.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    const updates = api.games.update.input.parse(req.body);
    const game = await storage.updateGame(id, updates);
    res.json(game);
  });

  app.delete(api.games.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    await storage.deleteGame(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Seed data
  await seed();

  return httpServer;
}

// Helper to seed data (call this in index.ts if needed, or here)
export async function seed() {
  const gamesList = await storage.getGames();
  if (gamesList.length === 0) {
    await storage.createGame({ title: "Catan", description: "Trade, build, settle.", minPlayers: 3, maxPlayers: 4 });
    await storage.createGame({ title: "Dixit", description: "A picture is worth a thousand words.", minPlayers: 3, maxPlayers: 6 });
    await storage.createGame({ title: "Codenames", description: "The top secret word game.", minPlayers: 4, maxPlayers: 8 });
    await storage.createGame({ title: "Ticket to Ride", description: "A cross-country train adventure.", minPlayers: 2, maxPlayers: 5 });
  }

  const eventsList = await storage.getEvents();
  if (eventsList.length === 0) {
    // Add next Friday 7pm
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + (5 + 7 - nextFriday.getDay()) % 7);
    nextFriday.setHours(19, 0, 0, 0);
    
    await storage.createEvent({
      title: "Friday Game Night",
      description: "Join us for our weekly game night! Beginners welcome.",
      date: nextFriday,
      location: "English Club Center",
      maxSeats: 20
    });
  }
}
