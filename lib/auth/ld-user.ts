type LdUser = {
  id: number;
  username: string;
  name?: string;
  avatar_template?: string;
  trust_level: number;
};

const DEFAULT_USER_ENDPOINT = "https://connect.linux.do/api/user";

export function getLdUserEndpoint() {
  return process.env.LD_OAUTH_USER_ENDPOINT || DEFAULT_USER_ENDPOINT;
}

export async function fetchLdUser(accessToken: string): Promise<LdUser> {
  const response = await fetch(getLdUserEndpoint(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LD user fetch failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as LdUser;
}

export type { LdUser };
