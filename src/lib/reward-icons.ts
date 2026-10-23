/**
 * Ikon reward bergaya 3D (Fluent Emoji, Microsoft, lisensi MIT) di /public/rewards.
 * Nilai yang disimpan di kolom Reward.icon adalah kunci di bawah ini.
 */
export const REWARD_ICONS = [
  { key: "gift", label: "Paket hadiah" },
  { key: "voucher", label: "Voucer" },
  { key: "card", label: "Kartu belanja" },
  { key: "money", label: "Saldo atau tunai" },
  { key: "shopping", label: "Tas belanja" },
  { key: "grocery", label: "Sembako" },
  { key: "meal", label: "Makan" },
  { key: "coffee", label: "Kopi" },
  { key: "snack", label: "Camilan" },
  { key: "tumbler", label: "Tumbler" },
  { key: "umbrella", label: "Payung" },
  { key: "tshirt", label: "Kaos" },
  { key: "jacket", label: "Jaket" },
  { key: "cap", label: "Topi" },
  { key: "backpack", label: "Tas ransel" },
  { key: "boots", label: "Sepatu keselamatan" },
  { key: "helmet", label: "Helm" },
  { key: "goggles", label: "Kacamata pelindung" },
  { key: "gloves", label: "Sarung tangan" },
  { key: "watch", label: "Jam tangan" },
  { key: "headphone", label: "Headphone" },
  { key: "powerbank", label: "Power bank" },
  { key: "phone", label: "Pulsa atau ponsel" },
  { key: "fuel", label: "Voucer BBM" },
  { key: "bicycle", label: "Sepeda" },
  { key: "ball", label: "Olahraga" },
  { key: "books", label: "Buku" },
  { key: "trophy", label: "Piala" },
  { key: "medal", label: "Medali" },
  { key: "star", label: "Penghargaan" },
] as const;

export type RewardIconKey = (typeof REWARD_ICONS)[number]["key"];

// Nama ikon lucide yang tersimpan pada data lama
const LEGACY: Record<string, RewardIconKey> = { Package: "gift", Umbrella: "umbrella", CupSoda: "tumbler", Footprints: "boots", Ticket: "voucher" };
const KEYS = new Set<string>(REWARD_ICONS.map((i) => i.key));

export function rewardIconKey(icon: string | null | undefined): RewardIconKey {
  if (icon && KEYS.has(icon)) return icon as RewardIconKey;
  return (icon && LEGACY[icon]) || "gift";
}

export function rewardIconSrc(icon: string | null | undefined) {
  return `/rewards/${rewardIconKey(icon)}.webp`;
}

export function isRewardIcon(icon: string) {
  return KEYS.has(icon);
}
