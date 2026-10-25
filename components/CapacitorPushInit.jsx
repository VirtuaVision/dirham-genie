"use client";

import { useEffect } from "react";

// This runs on every page load of the website — but the early return means
// it does nothing at all for regular web visitors. It only springs to life
// when the same site is loaded inside the Capacitor Android app shell,
// where window.Capacitor is injected automatically by the native runtime.
export default function CapacitorPushInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.Capacitor?.isNativePlatform?.()) return;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

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
