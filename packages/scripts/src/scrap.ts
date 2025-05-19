import { GitHubClient } from "../../functions/src/api/lib/github";

const github = new GitHubClient({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!,
});

const url = await github.getInstallationUrl();
console.log(url);

process.exit(0);

const octokit = await github.getInstallationOctokit(67244268);
const repo = await octokit.rest.repos.get({
  owner: "john-royal",
  repo: "functional-test-vite",
});

const branch = await octokit.rest.repos.getBranch({
  owner: "john-royal",
  repo: "functional-test-vite",
  branch: "main",
});

console.dir(
  {
    repo: repo.data,
    branch: branch.data,
  },
  { depth: null }
);
