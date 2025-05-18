import { GitHubClient } from "../../functions/src/api/lib/github";

const github = new GitHubClient({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

const installation = await github.listRepositories(67244268);
console.log(
  installation.repositories.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.html_url,
  }))
);
