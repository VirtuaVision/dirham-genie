export default function manifest() {
  return {
    name: "Dirham Genie — Best Amazon.ae Deals",
    short_name: "Dirham Genie",
    description: "Unlocking the best Amazon.ae deals in the UAE, every day.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B10",
    theme_color: "#0B0B10",
    icons: [
      { src: "/logo-dirham-genie.png", sizes: "512x512", type: "image/png" },
      { src: "/logo-dirham-genie.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
