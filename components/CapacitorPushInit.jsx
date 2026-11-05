"use client";

import { useEffect } from "react";

// Runs on every page load of the website, but does nothing for regular web
// visitors. It only activates when the site is opened inside the Dirham
// Genie Android app (a Capacitor shell), which injects window.Capacitor and
// its native plugins into the page. That means this file needs no npm
// package of its own — nothing to install or bundle for the website.
export default function CapacitorPushInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cap = window.Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    const PushNotifications = cap.Plugins?.PushNotifications;
    if (!PushNotifications) return;

    (async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;

        await PushNotifications.register();

        PushNotifications.addListener("registration", async (token) => {
          try {
            await fetch("/api/push/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: token.value, platform: "android" }),
            });
          } catch (err) {
            console.error("Push token registration failed:", err);
          }
        });

        PushNotifications.addListener("registrationError", (err) => {
          console.error("Push registration error:", err);
        });

        // Tapping a notification opens the relevant deal inside the app.
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const url = action.notification?.data?.url;
          if (url) window.location.href = url;
        });
      } catch (err) {
        console.error("Push notification setup failed:", err);
      }
    })();
  }, []);

  return null;
}
