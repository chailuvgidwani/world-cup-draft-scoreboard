// Maps each FIFA country code to a flag emoji. FIFA codes don't always match
// ISO 3166-1 alpha-2, so we keep an explicit table. England and Scotland use
// the subdivision flag tag sequences.
const FLAGS: Record<string, string> = {
  MEX: "🇲🇽", KOR: "🇰🇷", CZE: "🇨🇿", RSA: "🇿🇦",
  SUI: "🇨🇭", CAN: "🇨🇦", QAT: "🇶🇦", BIH: "🇧🇦",
  SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", MAR: "🇲🇦", BRA: "🇧🇷", HAI: "🇭🇹",
  USA: "🇺🇸", AUS: "🇦🇺", TUR: "🇹🇷", PAR: "🇵🇾",
  GER: "🇩🇪", CIV: "🇨🇮", ECU: "🇪🇨", CUW: "🇨🇼",
  SWE: "🇸🇪", JPN: "🇯🇵", NED: "🇳🇱", TUN: "🇹🇳",
  BEL: "🇧🇪", EGY: "🇪🇬", IRN: "🇮🇷", NZL: "🇳🇿",
  ESP: "🇪🇸", CPV: "🇨🇻", URU: "🇺🇾", KSA: "🇸🇦",
  FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴",
  POR: "🇵🇹", COD: "🇨🇩", UZB: "🇺🇿", COL: "🇨🇴",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
};

export function flagFor(code: string): string {
  return FLAGS[code] ?? "🏳️";
}
