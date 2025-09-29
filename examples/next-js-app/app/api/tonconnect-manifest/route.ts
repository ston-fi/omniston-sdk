import { retrieveEnvVariable } from "@/lib/utils";

export async function GET() {
  const manifest = {
    url: retrieveEnvVariable("OMNIDEMO__TONCONNECT__MANIFEST_URL").replace(
      "/api/tonconnect-manifest",
      "",
    ),
    name: "Omniston (demo)",
    iconUrl: "https://static.ston.fi/logo/external-logo.jpg",
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
