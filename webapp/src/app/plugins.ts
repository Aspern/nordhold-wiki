import type { App } from "vue";

import { createWikiI18n } from "../i18n/index.ts";
import { createWikiVuetify } from "../theme/index.ts";
import type { SupportedLocale } from "../types/content.ts";
import { router } from "../router/index.ts";

export function installApplicationPlugins(app: App, locale?: SupportedLocale): void {
  app.use(createWikiVuetify());
  app.use(locale === undefined ? createWikiI18n() : createWikiI18n(locale));
  app.use(router);
}
