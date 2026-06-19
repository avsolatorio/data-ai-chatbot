import { appConfig } from "@/lib/config";

/** Renders "DATA360 CHAT" with extra letter-spacing on "360" per Figma. */
export function SidebarAppTitle() {
  const name = appConfig.sidebar.appName;
  const match = /^(.+?)(360)(.*)$/i.exec(name);

  if (!match) {
    return (
      <span className="text-[17px] font-semibold uppercase leading-normal text-white">
        {name}
      </span>
    );
  }

  const [, before, digits, after] = match;

  return (
    <span className="text-[17px] font-semibold uppercase leading-normal text-white">
      {before}
      <span className="tracking-[0.8px]">{digits}</span>
      {after}
    </span>
  );
}
