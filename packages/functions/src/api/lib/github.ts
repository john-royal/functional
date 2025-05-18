import type { Database } from "@functional/db/client";
import { App } from "octokit";

interface GitHubClientOptions {
  appId: string;
  privateKey: string;
  db?: Database;
}

export class GitHubClient {
  app: App;

  constructor(options: GitHubClientOptions) {
    this.app = new App({
      appId: options.appId,
      privateKey: options.privateKey,
    });
  }

  async getInstallationUrl() {
    return await this.app.getInstallationUrl();
  }

  async getInstallation(id: number) {
    const res = await this.app.octokit.rest.apps.getInstallation({
      installation_id: id,
    });
    return res.data;
  }

  async listRepositories(installationId: number) {
    const octokit = await this.getInstallationOctokit(installationId);
    const res = await octokit.rest.apps.listReposAccessibleToInstallation({
      installation_id: installationId,
      per_page: 100,
    });
    return res.data;
  }

  async getInstallationAccessToken(installationId: number) {
    const res = await this.app.octokit.rest.apps.createInstallationAccessToken({
      installation_id: installationId,
    });
    return res.data.token;
  }

  async getRepositoryTarball(
    installationId: number,
    owner: string,
    repo: string,
    ref: string
  ) {
    return await fetch(
      `https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`,
      {
        headers: {
          Authorization: `Bearer ${await this.getInstallationAccessToken(installationId)}`,
          "User-Agent": "functional-deploy",
        },
      }
    );
  }

  async getInstallationOctokit(id: number) {
    return await this.app.getInstallationOctokit(id);
  }
}
