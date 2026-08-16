/**
 * Blog dataset.
 *
 * Requirement 4.1 — all portfolio content originates from typed local data
 * files under `data/`; Requirement 4.6 — every entry conforms to the `Blog`
 * model (id, slug, title, excerpt, coverImage, content, publishedDate,
 * readingTime, author, tags, featured, draft, seo).
 *
 * Conventions used by every `data/*.ts` module:
 * - one named export per module (`export const blogs: Blog[]`), never default
 * - ids and slugs are stable kebab-case strings; slugs are unique because they
 *   are the `/blog/[slug]` URL segment
 * - dates are `"YYYY-MM-DD"` strings (`ISODateString`) so the data stays
 *   JSON-serializable across the Server/Client Component boundary
 * - types are imported from the `@/types` barrel
 *
 * Fixture shape (deliberate, downstream selectors depend on it):
 * - six published posts, so `getRecentPublishedBlogs(2, 3)` has a real "3+"
 *   case and `/blog` has enough content to filter (Requirements 10.4, 20.2)
 * - one `draft: true` post whose `publishedDate` is the newest of the whole
 *   set, so any selector that forgets to filter drafts changes the observable
 *   ordering instead of failing silently (Requirements 10.1, 20.2)
 * - the draft's slug is a well-formed, valid-looking slug that simply is not
 *   published, which is what lets the article route distinguish "draft" from
 *   "missing" while returning the same not-found result for both
 * - all `publishedDate` values are distinct, so recency ordering (and therefore
 *   positional prev/next navigation) is total and unambiguous
 * - tags are drawn from a small shared vocabulary and overlap across posts, so
 *   the `/blog` category filter has multi-post categories to select
 *
 * `coverImage` paths point into `public/images/blog/`, which is currently empty;
 * the referenced files land with the real content pass.
 */

import type { Blog } from "@/types";

/**
 * Author display name for sample content. Replace with the Profile name when
 * real posts land; kept as a single constant so that is a one-line change.
 */
const AUTHOR = "Portfolio Author";

export const blogs: Blog[] = [
  {
    id: "pulseroom-real-time-chat",
    slug: "pulseroom-real-time-chat",
    title: "PulseRoom: Real-Time Chat Application",
    excerpt:
      "PulseRoom is a real-time chat application featuring room-based messaging, JWT authentication, WebSocket support via Socket.IO, and Redis-backed sessions. Built with a NestJS backend and Next.js frontend.",
    coverImage: "/images/blog/blog.png",
    content: `PulseRoom is a full-stack real-time chat application that demonstrates modern WebSocket communication patterns, JWT-based authentication, and Redis session management.

## Architecture

The application uses a NestJS backend with Socket.IO for real-time bidirectional communication, paired with a Next.js frontend for the user interface.

### Key Technologies

- **Backend**: NestJS, Socket.IO, Redis
- **Frontend**: Next.js, TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSocket via Socket.IO
- **Session Management**: Redis

## Features

### Room-Based Messaging

Users can create or join chat rooms, enabling organized conversations across different topics or groups.

### Real-Time Communication

Socket.IO powers instant message delivery with WebSocket connections, falling back gracefully to polling when needed.

### Secure Authentication

JWT tokens secure API endpoints and WebSocket connections, ensuring only authenticated users can access chat features.

### Redis Sessions

Redis stores user sessions for fast lookup and horizontal scalability, critical for real-time applications.

## Implementation Highlights

The backend leverages NestJS's WebSocket gateway pattern, making Socket.IO integration clean and testable. Redis acts as the session store and pub/sub layer for multi-instance deployments.

The Next.js frontend uses React hooks for WebSocket connection management, automatically reconnecting on disconnections and handling authentication token refresh.

## Learnings

Building PulseRoom reinforced the importance of connection state management in real-time apps. Handling reconnection logic, message queuing during disconnects, and session persistence across WebSocket upgrades required careful state orchestration on both client and server.`,
    publishedDate: "2025-01-05",
    readingTime: 8,
    author: "Sushovan Ghosh",
    tags: ["NestJS", "Next.js", "WebSocket", "Real-time", "Redis", "Socket.IO"],
    featured: true,
    draft: false,
    seo: {
      metaTitle: "PulseRoom: Building a Real-Time Chat Application",
      metaDescription:
        "Deep dive into building a real-time chat application with NestJS, Socket.IO, Redis, and Next.js. Learn about WebSocket communication, JWT authentication, and session management.",
    },
    externalUrl: "https://pulseroom.hashnode.dev/pulseroom-is-a-real-time-chat-application-featuring-room-based-messaging-jwt-authentication-websocket-support-via-socket-io-and-redis-backed-sessions-built-with-a-nestjs-backend-and-next-js-frontend",
  },
];
