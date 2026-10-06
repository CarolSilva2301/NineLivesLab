// Protótipo V1: credenciais fixas. Para trocar por autenticação segura,
// substitua apenas esta função (ex.: login real + verificação de papel).
const ADMIN_USER = "admin";
const ADMIN_PASS = "nine123";

export function assertAdmin(creds: { user: string; pass: string }) {
  if (creds.user !== ADMIN_USER || creds.pass !== ADMIN_PASS) {
    throw new Error("Credenciais inválidas");
  }
}
