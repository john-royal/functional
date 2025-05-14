import {
  createClient,
  type AuthorizeOptions,
  type Challenge,
  type Client,
  type ClientInput,
} from "@openauthjs/openauth/client";
import { subjects } from "./subjects";
import type { SubjectPayload } from "@openauthjs/openauth/subject";

export interface AuthClientInput extends ClientInput {
  redirectURI: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export type { Challenge };

export type Subject = SubjectPayload<typeof subjects>;

export class AuthClient {
  private client: Client;
  private redirectURI: string;

  constructor({ redirectURI, ...input }: AuthClientInput) {
    this.client = createClient(input);
    this.redirectURI = redirectURI;
  }

  async authorize(opts?: AuthorizeOptions) {
    return await this.client.authorize(this.redirectURI, "code", opts);
  }

  async exchange(code: string, verifier?: string) {
    return await this.client.exchange(code, this.redirectURI, verifier);
  }

  async refresh(refreshToken: string) {
    return await this.client.refresh(refreshToken);
  }

  async verify(tokens: Tokens) {
    return await this.client.verify(subjects, tokens.access, {
      refresh: tokens.refresh,
    });
  }
}
