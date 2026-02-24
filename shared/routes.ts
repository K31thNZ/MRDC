
import { z } from 'zod';
import { insertUserSchema, insertEventSchema, insertGameSchema, insertGameSuggestionSchema } from './schema';

export { insertUserSchema, insertEventSchema, insertGameSchema, insertGameSuggestionSchema };

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<any>(), // Returns User
        400: errorSchemas.validation,
        409: errorSchemas.conflict,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<any>(), // Returns User
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<any>(), // Returns User
        401: errorSchemas.unauthorized,
      },
    },
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events' as const,
      responses: {
        200: z.array(z.custom<any>()), // EventWithDetails[]
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events' as const,
      input: insertEventSchema,
      responses: {
        201: z.custom<any>(), // Event
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/events/:id' as const,
      input: insertEventSchema.partial().extend({ isCompleted: z.boolean().optional() }),
      responses: {
        200: z.custom<any>(), // Event
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    reserve: {
      method: 'POST' as const,
      path: '/api/events/:id/reserve' as const,
      responses: {
        200: z.custom<any>(), // Reservation
        404: errorSchemas.notFound,
        409: errorSchemas.conflict,
      },
    },
    cancelReservation: {
      method: 'DELETE' as const,
      path: '/api/events/:id/reserve' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    getNominations: {
      method: 'GET' as const,
      path: '/api/events/:id/nominations' as const,
      responses: {
        200: z.array(z.custom<any>()), // NominationWithDetails[]
      },
    },
    nominate: {
      method: 'POST' as const,
      path: '/api/events/:id/nominations' as const,
      input: z.object({ gameId: z.number() }),
      responses: {
        201: z.custom<any>(), // Nomination
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    vote: {
      method: 'POST' as const,
      path: '/api/nominations/:id/vote' as const,
      responses: {
        200: z.custom<any>(), // Vote
        404: errorSchemas.notFound,
      },
    },
  },
  games: {
    list: {
      method: 'GET' as const,
      path: '/api/games' as const,
      responses: {
        200: z.array(z.custom<any>()), // Game[]
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/games' as const,
      input: insertGameSchema,
      responses: {
        201: z.custom<any>(), // Game
        403: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/games/:id' as const,
      input: insertGameSchema.partial(),
      responses: {
        200: z.custom<any>(), // Game
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/games/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    suggest: {
      method: 'POST' as const,
      path: '/api/games/suggest' as const,
      input: insertGameSuggestionSchema,
      responses: {
        201: z.custom<any>(), // GameSuggestion
        401: errorSchemas.unauthorized,
      },
    },
    listSuggestions: {
      method: 'GET' as const,
      path: '/api/games/suggestions' as const,
      responses: {
        200: z.array(z.custom<any>()), // GameSuggestion[]
        403: errorSchemas.unauthorized,
      },
    },
    updateSuggestion: {
      method: 'PATCH' as const,
      path: '/api/games/suggestions/:id' as const,
      input: z.object({ status: z.enum(['approved', 'rejected']) }),
      responses: {
        200: z.custom<any>(), // GameSuggestion
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
