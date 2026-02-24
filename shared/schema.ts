
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Telegram username
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "member"] }).default("member").notNull(),
  dice: integer("dice").default(0).notNull(), // Loyalty points
  telegramId: text("telegram_id"), // Verified Telegram ID
  isTelegramVerified: boolean("is_telegram_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  minPlayers: integer("min_players"),
  maxPlayers: integer("max_players"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  maxSeats: integer("max_seats").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(), // To process loyalty rewards
  gameId: integer("game_id").references(() => games.id), // Fixed game for the event
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  status: text("status", { enum: ["confirmed", "waitlist", "cancelled"] }).default("confirmed").notNull(),
  attended: boolean("attended").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nominations = pgTable("nominations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  nominatedBy: integer("nominated_by").references(() => users.id).notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  nominationId: integer("nomination_id").references(() => nominations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const gameSuggestions = pgTable("game_suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  suggestedBy: integer("suggested_by").references(() => users.id).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
  nominations: many(nominations),
  votes: many(votes),
  gameSuggestions: many(gameSuggestions),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  reservations: many(reservations),
  nominations: many(nominations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [reservations.eventId],
    references: [events.id],
  }),
}));

export const nominationsRelations = relations(nominations, ({ one, many }) => ({
  event: one(events, {
    fields: [nominations.eventId],
    references: [events.id],
  }),
  game: one(games, {
    fields: [nominations.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [nominations.nominatedBy],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  nomination: one(nominations, {
    fields: [votes.nominationId],
    references: [nominations.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, dice: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, isCompleted: true }).extend({
  gameId: z.number().nullable().optional(),
});
export const insertReservationSchema = createInsertSchema(reservations).omit({ id: true, createdAt: true, status: true });
export const insertNominationSchema = createInsertSchema(nominations).omit({ id: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ id: true });
export const insertGameSuggestionSchema = createInsertSchema(gameSuggestions).omit({ id: true, createdAt: true, status: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type Nomination = typeof nominations.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type GameSuggestion = typeof gameSuggestions.$inferSelect;

// Request/Response types

export type AuthResponse = User;

// Events
export type CreateEventRequest = InsertEvent;
export type UpdateEventRequest = Partial<InsertEvent> & { isCompleted?: boolean };

// Reservations
export type CreateReservationRequest = { eventId: number }; // userId inferred from session

// Nominations & Voting
export type CreateNominationRequest = { eventId: number; gameId: number };
export type CreateVoteRequest = { nominationId: number };

// Views
export type EventWithDetails = Event & {
  attendeeCount: number;
  userReservationStatus?: "confirmed" | "waitlist" | "cancelled" | null;
  game?: Game | null;
};

export type NominationWithDetails = Nomination & {
  game: Game;
  voteCount: number;
  hasVoted: boolean;
};
