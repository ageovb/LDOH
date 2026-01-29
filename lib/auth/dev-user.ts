export type DevUserConfig = {
  id: number;
  username: string;
  trustLevel: number;
};

export function getDevUserConfig(): DevUserConfig {
  const username = (process.env.LD_DEV_USERNAME || "").trim();
  if (!username) {
    throw new Error("LD_DEV_USERNAME is not configured");
  }

  const trustLevelRaw = process.env.LD_DEV_TRUST_LEVEL;
  if (trustLevelRaw === undefined || trustLevelRaw === "") {
    throw new Error("LD_DEV_TRUST_LEVEL is not configured");
  }
  const trustLevel = Number(trustLevelRaw);
  if (!Number.isFinite(trustLevel) || trustLevel < 0) {
    throw new Error("LD_DEV_TRUST_LEVEL is invalid");
  }

  const userIdRaw = process.env.LD_DEV_USER_ID;
  if (userIdRaw === undefined || userIdRaw === "") {
    throw new Error("LD_DEV_USER_ID is not configured");
  }
  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId) || userId < 0) {
    throw new Error("LD_DEV_USER_ID is invalid");
  }

  return { id: userId, username, trustLevel };
}
