export type ApiKeyMode = "guest" | "custom";

export interface ApiKeySettings {
  onboardingComplete: boolean;
  mode: ApiKeyMode;
  customKey: string;
}

export const API_KEY_HEADER = "X-YouTube-Api-Key";
