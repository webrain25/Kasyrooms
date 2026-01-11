import { SirplayClient } from "./sirplayClient";

export type SirplayOutboundUser = {
  id: string;
  externalUserId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  country: string; // ISO country code (e.g., IT)
  phoneNumber?: string;
};

export async function createUserOnSirplay(user: SirplayOutboundUser) {
  const client = SirplayClient.fromEnv();
  const path = (process.env.SIRPLAY_USERS_CREATE_PATH || "/api/users").trim();
  return client.request<any>("POST", path, user);
}

export async function updateUserOnSirplay(user: SirplayOutboundUser) {
  const client = SirplayClient.fromEnv();
  let path = (process.env.SIRPLAY_USERS_UPDATE_PATH || "/api/users/:externalUserId").trim();
  path = path.replace(":externalUserId", encodeURIComponent(user.externalUserId));
  return client.request<any>("PUT", path, user);
}
