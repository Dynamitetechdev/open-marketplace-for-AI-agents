import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { verifyMessage } from "ethers";

// In-memory nonce store for MVP
const nonces = new Map(); // wallet(lowercase) -> { nonce, issuedAt }

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const encoder = new TextEncoder();

export function issueNonce(wallet) {
  const w = String(wallet || "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(w)) throw new Error("Invalid wallet address");
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  nonces.set(w, { nonce, issuedAt });
  return { wallet: w, nonce, issuedAt };
}

export function getStoredNonce(wallet) {
  const w = String(wallet || "").toLowerCase();
  return nonces.get(w) || null;
}

export async function verifyWalletSignature({ wallet, signature, nonce }) {
  const w = String(wallet || "").toLowerCase();
  const record = nonces.get(w);
  if (!record || record.nonce !== nonce)
    return { ok: false, error: "Nonce mismatch" };
  const message = `Sign this nonce: ${nonce}`;
  let signer;
  try {
    signer = verifyMessage(message, signature);
  } catch (err) {
    return { ok: false, error: "Invalid signature" };
  }
  if (String(signer || "").toLowerCase() !== w)
    return { ok: false, error: "Address mismatch" };
  // one-time use
  nonces.delete(w);
  return { ok: true };
}

export async function signJWT(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(encoder.encode(JWT_SECRET));
  return token;
}

export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
    return payload;
  } catch (_err) {
    return null;
  }
}

export async function requireAuth(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return await verifyJWT(token);
}
