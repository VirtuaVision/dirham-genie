"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken: token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStatus("done");
      setMessage("You're subscribed! We'll send you the best deals.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <div className="text-center max-w-md mx-auto">
      <h3 className="font-display text-lg text-gold mb-1">Never miss a deal</h3>
      <p className="text-cream/60 text-sm mb-4">
        Get the best Amazon.ae discounts sent to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
        <div className="flex gap-2 w-full">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-md bg-ink-lighter border border-gold/30 px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-gold outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-md bg-gold hover:bg-gold-bright text-ink text-sm font-semibold px-4 disabled:opacity-60"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </div>
        <TurnstileWidget onToken={setToken} />
      </form>
      {message && (
        <p className={`text-xs mt-2 ${status === "error" ? "text-red-300" : "text-deal-green"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
