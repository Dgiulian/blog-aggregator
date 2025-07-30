# Blog Aggregator CLI

A command-line RSS feed aggregator that allows you to follow blogs and read their posts directly from your terminal.

## Features

- **User Management**: Create and switch between different user profiles
- **Feed Management**: Add, list, follow, and unfollow RSS feeds
- **Post Aggregation**: Automatically fetch and store posts from followed feeds
- **Post Browsing**: View the latest posts from feeds you follow

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/blog-aggregator.git
   cd blog-aggregator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the configuration file:
   Create a `.gatorconfig.json` file in your home directory with the following content:

   ```json
   {
     "db_url": "postgres://username:password@localhost:5432/blog_aggregator",
     "current_user_name": "default"
   }
   ```

   Replace the database URL with your PostgreSQL connection string.

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

## Usage

The Blog Aggregator CLI provides various commands to manage feeds and posts. Here are the main commands:

### User Management

#### Register a new user

```bash
npm start -- register <username>
```

#### Login as a user

```bash
npm start -- login <username>
```

#### List all users

```bash
npm start -- users
```

### Feed Management

#### Add a new feed

```bash
npm start -- addfeed <name> <url>
```

This command adds a new feed and automatically follows it.

#### List all feeds

```bash
npm start -- feeds
```

#### Follow a feed

```bash
npm start -- follow <url>
```

#### List followed feeds

```bash
npm start -- following
```

#### Unfollow a feed

```bash
npm start -- unfollow <url>
```

### Post Management

#### Aggregate posts

```bash
npm start -- agg <time_between_requests>
```

This command continuously fetches posts from all feeds at the specified interval.
Examples:

- `npm start -- agg 10s` (fetch every 10 seconds)
- `npm start -- agg 1m` (fetch every minute)
- `npm start -- agg 1h` (fetch every hour)

Press Ctrl+C to stop the aggregation process.

#### Browse posts

```bash
npm start -- browse [limit]
```

This command displays the latest posts from feeds you follow.
The optional `limit` parameter specifies how many posts to display (default: 2).

### Reset Database

```bash
npm start -- reset
```

This command resets the database by dropping all tables and recreating them.

## Development

### Generate Database Migrations

After making changes to the schema in `src/schema.ts`, generate a new migration:

```bash
npm run db:generate
```

### Apply Database Migrations

Apply the generated migrations to the database:

```bash
npm run db:migrate
```

## Project Structure

- `src/`: Source code
  - `commands.ts`: Command handlers
  - `config.ts`: Configuration management
  - `index.ts`: Entry point
  - `rss.ts`: RSS feed fetching and parsing
  - `schema.ts`: Database schema
  - `lib/db/`: Database-related code
    - `queries/`: Database queries
      - `feeds.ts`: Feed-related queries
      - `feedFollows.ts`: Feed follow-related queries
      - `posts.ts`: Post-related queries
      - `users.ts`: User-related queries
  - `db/migrations/`: Database migrations

## License

ISC
