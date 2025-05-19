declare module "cloudflare:workers" {
  namespace Cloudflare {
    interface Env {
      FRONTEND_URL: string;
      AUTH_URL: string;
      API_URL: string;
      AUTH: Fetcher;
      API: Fetcher;
    }
  }
}
