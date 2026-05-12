import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Example schema — replace with the real product's tables on event day.
 *
 * Keeping a "sessions" table here as a starter: useful for any voice/chat
 * product to track conversation history with timestamps for the demo.
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  trackSlug: text("track_slug"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Session = typeof sessions.$inferSelect;
export type Message = typeof messages.$inferSelect;
