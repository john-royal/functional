import { and, eq, schema } from "@functional/db";
import { createDatabaseClient, type Database } from "@functional/db/client";
import { createId } from "@paralleldrive/cuid2";

export class DatabaseClient {
  db: Database;

  constructor(connectionString: string) {
    this.db = createDatabaseClient(connectionString);
  }

  async findUser(githubId: number) {
    const [user] = await this.db
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

  async createUser(profile: {
    id: number;
    name: string;
    login: string;
    email: string;
    avatar_url: string;
  }) {
    return await this.db.transaction(async (tx) => {
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
    });
  }
}

export namespace GitHub {
  export const fetchUser = async (accessToken: string) => {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Functional (Dev)",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch user info: ${res.statusText}`);
    }
    return res.json() as Promise<{
      id: number;
      name: string;
      login: string;
      email?: string;
      avatar_url: string;
    }>;
  };

  export const fetchEmail = async (accessToken: string) => {
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
  };
}
