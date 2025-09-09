import nacl from "tweetnacl";

function hexToUint8Array(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function verifyDiscordSignature({
  bodyText,
  signature,
  timestamp,
  publicKey,
}) {
  if (!signature || !timestamp || !bodyText || !publicKey) return false;
  const encoder = new TextEncoder();
  const message = encoder.encode(timestamp + bodyText);
  try {
    return nacl.sign.detached.verify(
      message,
      hexToUint8Array(signature),
      hexToUint8Array(publicKey)
    );
  } catch (_err) {
    return false;
  }
}
