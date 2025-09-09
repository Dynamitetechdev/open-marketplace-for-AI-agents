"use client";

import { useEffect, useState } from "react";

export default function WalletButton() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("jwt");
    const addr = window.localStorage.getItem("wallet");
    if (token && addr) setAddress(addr);
  }, []);

  async function signIn() {
    try {
      setLoading(true);
      if (!window.ethereum) throw new Error("No wallet found");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const wallet = String(accounts?.[0] || "");
      if (!wallet) throw new Error("No account selected");
      const nonceResp = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const { nonce } = await nonceResp.json();
      if (!nonceResp.ok) throw new Error("Failed to get nonce");
      const message = `Sign this nonce: ${nonce}`;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, wallet],
      });
      const verifyResp = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, signature, nonce }),
      });
      const data = await verifyResp.json();
      if (!verifyResp.ok)
        throw new Error(data?.error || "Failed to verify signature");
      window.localStorage.setItem("jwt", data.token);
      window.localStorage.setItem("wallet", wallet);
      setAddress(wallet);
    } catch (err) {
      alert(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    window.localStorage.removeItem("jwt");
    window.localStorage.removeItem("wallet");
    setAddress("");
  }

  if (address) {
    const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-black/70 dark:text-white/70">
          {short}
        </span>
        <button
          onClick={signOut}
          className="rounded-full border border-black/[.12] dark:border-white/[.18] px-3 py-1.5 text-sm hover:bg-black/[.04] dark:hover:bg-white/[.06]"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="rounded-full bg-foreground text-background px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Signing..." : "Sign In"}
    </button>
  );
}
