import { and, eq, schema } from "@functional/db";
import {
  createDatabaseClient,
  type Database,
  type DatabaseTransaction,
} from "@functional/db/client";
import { createId } from "@paralleldrive/cuid2";

export interface UpsertUser {
  id: string;
  defaultTeam: {
    id: string;
    slug: string;
  };
}

export interface GitHubProfile {
  id: number;
  name: string;
  login: string;
  email: string;
  avatar_url: string;
}

export class DatabaseClient {
  db: Database;

  constructor(
    connectionString: string,
    private readonly ctx: ExecutionContext
  ) {
    this.db = createDatabaseClient(connectionString);
  }

  async upsertUser(profile: GitHubProfile): Promise<UpsertUser> {
    const key = new URL(
      `https://auth.functional.dev/cache/github-user/${profile.id}`
    );
    const cached = await caches.default.match(key);
    if (cached) {
      return cached.json<UpsertUser>();
    }
    const user = await this.db.transaction(async (tx) => {
      const user = await this.findUser(tx, profile.id);
      if (user) {
        return user;
      }
      return await this.createUser(tx, profile);
    });
    this.ctx.waitUntil(caches.default.put(key, Response.json(user)));
    return user;
  }

  private async findUser(tx: DatabaseTransaction, githubId: number) {
    const [user] = await tx
      .select({
        id: schema.users.id,
        defaultTeamId: schema.users.defaultTeamId,
        defaultTeamSlug: schema.teams.slug,
      })
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.provider, "github"),
          eq(schema.accounts.providerAccountId, githubId.toString())
        )
      )
      .innerJoin(schema.users, eq(schema.accounts.userId, schema.users.id))
      .innerJoin(schema.teams, eq(schema.users.defaultTeamId, schema.teams.id))
      .limit(1);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      defaultTeam: {
        id: user.defaultTeamId,
        slug: user.defaultTeamSlug,
      },
    };
  }

  private async createUser(tx: DatabaseTransaction, profile: GitHubProfile) {
    const userId = createId();
    const teamId = createId();
    await tx.insert(schema.teams).values({
      id: teamId,
      name: profile.name,
      slug: profile.login,
      type: "personal",
    });
    await tx.insert(schema.users).values({
      id: userId,
      name: profile.name,
      image: profile.avatar_url,
      slug: profile.login,
      defaultTeamId: teamId,
    });
    await Promise.all([
      tx.insert(schema.accounts).values({
        id: createId(),
        userId,
        provider: "github",
        providerAccountId: profile.id.toString(),
      }),
      tx.insert(schema.teamMembers).values({
        userId,
        teamId,
        role: "owner",
      }),
    ]);
    return {
      id: userId,
      defaultTeam: {
        id: teamId,
        slug: profile.login,
      },
    };
  }
}

export class GitHubAuthClient {
  constructor(private readonly ctx: ExecutionContext) {}

  async fetchProfile(accessToken: string): Promise<GitHubProfile> {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Functional (Dev)",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch user info: ${res.statusText}`);
    }
    const user = await res.json<GitHubProfile>();
    if (!user.email) {
      user.email = await this.fetchEmailWithCache(user.id, accessToken);
    }
    return user;
  }

  async fetchEmailWithCache(id: number, accessToken: string) {
    const key = new URL(`https://auth.functional.dev/cache/github-email/${id}`);
    const cached = await caches.default.match(key);
    if (cached) {
      return cached.text();
    }
    const email = await this.fetchEmail(accessToken);
    this.ctx.waitUntil(caches.default.put(key, new Response(email)));
    return email;
  }

  async fetchEmail(accessToken: string) {
    const res = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Functional (Dev)",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch user emails: ${res.statusText}`);
    }
    const emails = (await res.json()) as {
      email: string;
      primary: boolean;
      verified: boolean;
      visibility: string;
    }[];
    if (!emails[0]) {
      throw new Error("No emails found");
    }
    return emails[0].email;
  }
}
