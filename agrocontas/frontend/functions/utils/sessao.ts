const enc = new TextEncoder();
export const SESSAO_SEGUNDOS = 60 * 60 * 24 * 7;

function chave(secret: string, usos: ("sign" | "verify")[]): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usos);
}

const toHex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

// Token = "<expira em ms>.<HMAC-SHA256 hex>", guardado em cookie HttpOnly.
export async function criarToken(secret: string): Promise<string> {
  const exp = String(Date.now() + SESSAO_SEGUNDOS * 1000);
  const sig = await crypto.subtle.sign("HMAC", await chave(secret, ["sign"]), enc.encode(exp));
  return `${exp}.${toHex(sig)}`;
}

export async function tokenValido(token: string | null, secret: string): Promise<boolean> {
  const [exp, sig] = token?.split(".") ?? [];
  if (!exp || !sig || !/^([0-9a-f]{2})+$/.test(sig) || Number(exp) < Date.now()) return false;
  const bytes = Uint8Array.from(sig.match(/../g)!, (h) => parseInt(h, 16));
  return crypto.subtle.verify("HMAC", await chave(secret, ["verify"]), bytes, enc.encode(exp));
}

export async function senhaConfere(informada: string, esperada: string): Promise<boolean> {
  const [a, b] = await Promise.all([informada, esperada].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))));
  return crypto.subtle.timingSafeEqual(a, b);
}

export function lerCookieSessao(req: Request): string | null {
  return /(?:^|;\s*)sessao=([^;]+)/.exec(req.headers.get("Cookie") ?? "")?.[1] ?? null;
}

export function cookieSessao(valor: string, segundos: number): string {
  return `sessao=${valor}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${segundos}`;
}
