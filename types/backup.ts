import type { AppState } from "@/types";
import type { ApiKeySettings } from "@/types/api-key";

export const BACKUP_VERSION = 1;

export interface YtBingerBackup {
  version: typeof BACKUP_VERSION;
  exportedAt: number;
  app: AppState;
  apiKey: ApiKeySettings;
}
