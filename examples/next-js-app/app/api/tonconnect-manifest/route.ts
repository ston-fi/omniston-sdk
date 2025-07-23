export async function GET() {
  const manifestUrl = process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL;

  if (!manifestUrl) {
    return new Response(
      JSON.stringify({
        error: "NEXT_PUBLIC_TONCONNECT_MANIFEST_URL not configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const manifest = {
    url: manifestUrl.replace("/api/tonconnect-manifest", ""),
    name: "Omniston (demo)",
    iconUrl: "https://static.ston.fi/logo/external-logo.jpg",
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
