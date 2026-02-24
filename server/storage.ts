
import { db } from "./db";
import {
  users, games, events, reservations, nominations, votes, gameSuggestions,
  type User, type InsertUser, type Game, type InsertGame,
  type Event, type InsertEvent, type Reservation,
  type Nomination, type Vote, type GameSuggestion
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: "admin" | "member" }): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  sessionStore: session.Store;

  // Games
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, updates: Partial<InsertGame>): Promise<Game>;
  deleteGame(id: number): Promise<void>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent> & { isCompleted?: boolean }): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Reservations
  getReservationsByEvent(eventId: number): Promise<(Reservation & { user: User })[]>;
  getUserReservation(userId: number, eventId: number): Promise<Reservation | undefined>;
  createReservation(userId: number, eventId: number): Promise<Reservation>;
  deleteReservation(userId: number, eventId: number): Promise<void>;
  updateAttendance(eventId: number, userIds: number[]): Promise<void>;

  // Nominations & Votes
  getNominationsByEvent(eventId: number): Promise<(Nomination & { game: Game, voteCount: number })[]>;
  createNomination(userId: number, eventId: number, gameId: number): Promise<Nomination>;
  getVote(userId: number, nominationId: number): Promise<Vote | undefined>;
  createVote(userId: number, nominationId: number): Promise<Vote>;
  
  // Loyalty
  awardDice(userId: number, amount: number): Promise<void>;

  // Game Suggestions
  getGameSuggestions(): Promise<GameSuggestion[]>;
  createGameSuggestion(userId: number, title: string, description: string): Promise<GameSuggestion>;
  updateGameSuggestionStatus(id: number, status: "approved" | "rejected"): Promise<GameSuggestion>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser & { role?: "admin" | "member" }): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  // Games
  async getGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(games.title);
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async updateGame(id: number, updates: Partial<InsertGame>): Promise<Game> {
    const [updated] = await db.update(games).set(updates).where(eq(games.id, id)).returning();
    return updated;
  }

  async deleteGame(id: number): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  // Events
  async getEvents(): Promise<(Event & { game?: Game | null })[]> {
    const results = await db
      .select({
        event: events,
        game: games,
      })
      .from(events)
      .leftJoin(games, eq(events.gameId, games.id))
      .orderBy(desc(events.date));
    
    return results.map(r => ({
      ...r.event,
      game: r.game,
    }));
  }

  async getEvent(id: number): Promise<(Event & { game?: Game | null }) | undefined> {
    const [result] = await db
      .select({
        event: events,
        game: games,
      })
      .from(events)
      .leftJoin(games, eq(events.gameId, games.id))
      .where(eq(events.id, id));
    
    if (!result) return undefined;
    return {
      ...result.event,
      game: result.game,
    };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent> & { isCompleted?: boolean }): Promise<Event> {
    const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Reservations
  async getReservationsByEvent(eventId: number): Promise<(Reservation & { user: User })[]> {
    const results = await db
      .select({
        reservation: reservations,
        user: users,
      })
      .from(reservations)
      .innerJoin(users, eq(reservations.userId, users.id))
      .where(eq(reservations.eventId, eventId));

    return results.map(r => ({
      ...r.reservation,
      user: r.user,
    }));
  }

  async getUserReservation(userId: number, eventId: number): Promise<Reservation | undefined> {
    const [res] = await db.select().from(reservations).where(
      and(eq(reservations.userId, userId), eq(reservations.eventId, eventId))
    );
    return res;
  }

  async createReservation(userId: number, eventId: number): Promise<Reservation> {
    const [res] = await db.insert(reservations).values({ userId, eventId }).returning();
    return res;
  }

  async deleteReservation(userId: number, eventId: number): Promise<void> {
    await db.delete(reservations).where(
      and(eq(reservations.userId, userId), eq(reservations.eventId, eventId))
    );
  }

  async updateAttendance(eventId: number, userIds: number[]): Promise<void> {
    // Reset attendance for all confirmed reservations for this event
    await db.update(reservations)
      .set({ attended: false })
      .where(eq(reservations.eventId, eventId));

    if (userIds.length > 0) {
      // Mark specific users as attended
      await db.update(reservations)
        .set({ attended: true })
        .where(
          and(
            eq(reservations.eventId, eventId),
            sql`${reservations.userId} IN ${userIds}`
          )
        );

      // Award dice to those who attended
      for (const userId of userIds) {
        await this.awardDice(userId, 1);
      }
    }
  }

  // Nominations & Votes
  async getNominationsByEvent(eventId: number): Promise<(Nomination & { game: Game, voteCount: number })[]> {
    const eventNominations = await db.select({
      nomination: nominations,
      game: games,
      voteCount: sql<number>`count(${votes.id})::int`
    })
    .from(nominations)
    .innerJoin(games, eq(nominations.gameId, games.id))
    .leftJoin(votes, eq(votes.nominationId, nominations.id))
    .where(eq(nominations.eventId, eventId))
    .groupBy(nominations.id, games.id);

    return eventNominations.map(n => ({
      ...n.nomination,
      game: n.game,
      voteCount: n.voteCount
    }));
  }

  async createNomination(userId: number, eventId: number, gameId: number): Promise<Nomination> {
    const [nom] = await db.insert(nominations).values({ userId, eventId, gameId, nominatedBy: userId }).returning();
    return nom;
  }

  async getVote(userId: number, nominationId: number): Promise<Vote | undefined> {
    const [v] = await db.select().from(votes).where(
      and(eq(votes.userId, userId), eq(votes.nominationId, nominationId))
    );
    return v;
  }

  async createVote(userId: number, nominationId: number): Promise<Vote> {
    const [v] = await db.insert(votes).values({ userId, nominationId }).returning();
    return v;
  }

  // Loyalty
  async awardDice(userId: number, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    await db.update(users).set({ dice: user.dice + amount }).where(eq(users.id, userId));
  }

  // Game Suggestions
  async getGameSuggestions(): Promise<GameSuggestion[]> {
    return await db.select().from(gameSuggestions).orderBy(desc(gameSuggestions.createdAt));
  }

  async createGameSuggestion(userId: number, title: string, description: string): Promise<GameSuggestion> {
    const [suggestion] = await db.insert(gameSuggestions).values({ 
      title, 
      description, 
      suggestedBy: userId 
    }).returning();
    return suggestion;
  }

  async updateGameSuggestionStatus(id: number, status: "approved" | "rejected"): Promise<GameSuggestion> {
    const [updated] = await db.update(gameSuggestions)
      .set({ status })
      .where(eq(gameSuggestions.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
