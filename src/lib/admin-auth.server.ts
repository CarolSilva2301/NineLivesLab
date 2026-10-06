// Credenciais do admin vêm de segredos do servidor (ADMIN_USER / ADMIN_PASSWORD).
// Para trocar por autenticação real, substitua apenas esta função.
function safeEqual(a: string, b: string) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function assertAdmin(creds: { user: string; pass: string }) {
  const user = process.env["ADMIN_USER"] || "admin";
  const pass = process.env["ADMIN_PASSWORD"];
  if (!pass || pass.length < 8) throw new Error("Senha de admin não configurada");
  const okUser = safeEqual(creds.user, user);
  const okPass = safeEqual(creds.pass, pass);
  if (!okUser || !okPass) throw new Error("Credenciais inválidas");
}
