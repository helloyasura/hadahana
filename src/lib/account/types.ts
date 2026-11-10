export type SavedHoroscope = { id: string; birth: Record<string, unknown>; createdAt: string };
export type Profile = {
  id: string; name: string; email: string;
  license: { active: boolean; status: string; expiresAt: string | null; trialEndsAt: string | null; daysLeft: number | null };
  horoscopes: SavedHoroscope[]; portalUrl: string;
};
