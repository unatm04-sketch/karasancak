import { initials } from "@/lib/format";

type AvatarUser = {
  id: string;
  displayName: string;
  avatarVersion?: number | null;
};

const SIZES = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
  xl: "size-28 text-4xl",
} as const;

/** Görsel yüklememiş üyeler için de her zaman aynı görünen arma */
function tone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ["bg-steel text-bone", "bg-bone text-ink", "bg-al text-bone"][hash % 3]!;
}

export function Avatar({
  user,
  size = "md",
  className = "",
}: {
  user: AvatarUser;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (user.avatarVersion && user.avatarVersion > 0) {
    return (
      // Görsel zaten 256 piksele küçültülmüş olarak saklanıyor, optimize etmeye gerek yok.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatar/${user.id}?v=${user.avatarVersion}`}
        alt=""
        loading="lazy"
        className={`shield shrink-0 bg-steel object-cover ${SIZES[size]} ${className}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`shield display inline-flex shrink-0 items-center justify-center ${tone(user.id)} ${SIZES[size]} ${className}`}
    >
      {initials(user.displayName)}
    </span>
  );
}
