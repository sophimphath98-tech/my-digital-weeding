import { googleFontsHref } from "@/lib/event";
import type { EventConfig } from "@/lib/types";

export function FontLinks({ config }: { config: EventConfig }) {
  return <link rel="stylesheet" href={googleFontsHref([config.fontKh, config.fontBodyKh, config.fontEn, "Ovo"])} precedence="default" />;
}
