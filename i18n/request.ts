import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

const locales = ["en", "es"];

export default getRequestConfig(async () => {
  const headersList = await headers();

  // next-intl stores locale here internally
  const locale =
    headersList.get("x-next-intl-locale") || "en";

  const safeLocale = locales.includes(locale) ? locale : "en";

  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default
  };
});