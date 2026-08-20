"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatAed, discountPercent } from "@/lib/formatCurrency";
import { timeAgo } from "@/lib/timeAgo";
import CountdownTimer from "@/components/CountdownTimer";
import StarRating from "@/components/StarRating";
import { useIsAdmin } from "@/components/AdminStatusProvider";

// Amazon image URLs carry their resolution in the filename itself
// (e.g. "._SL500_.jpg"). Bumping that number gets a noticeably sharper
// photo from Amazon's own CDN without any extra processing on our side.
function upscaleAmazonImage(url) {
  if (!url) return url;
  return url.replace(/_S[LXY]\d+_/, "_SL1000_");
}

export default function ProductCard({ product }) {
  const discount = discountPercent(product.price, product.list_price);
  const checked = timeAgo(product.last_synced_at || product.updated_at);
  const hiResImage = upscaleAmazonImage(product.image_url);
  const isAdmin = useIsAdmin();
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState(null);

  function handleAmazonClick(e) {
    e.stopPropagation();
    fetch("/api/clicks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
      keepalive: true,
    }).catch(() => {});
  }

  async function handleQuickPost(e) {
    e.preventDefault();
    e.stopPropagation();
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch("/api/social/quick-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      const { results } = json;
      const posted = [];
      const failedDetails = [];
      for (const [platform, r] of Object.entries(results || {})) {
        if (r.ok) posted.push(platform);
        else if (!r.skipped) failedDetails.push(`${platform} (${r.error || "unknown error"})`);
      }
      if (posted.length === 0) {
        setPostResult({ ok: false, text: "Nothing posted — check platform setup in admin." });
      } else if (failedDetails.length === 0) {
        setPostResult({ ok: true, text: `Posted to ${posted.join(", ")} ✅` });
      } else {
        setPostResult({ ok: true, text: `Posted to ${posted.join(", ")}. Failed: ${failedDetails.join("; ")}` });
      }
    } catch (err) {
      setPostResult({ ok: false, text: err.message });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="card-surface rounded-lg ov