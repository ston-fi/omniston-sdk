import { useQuery } from "@tanstack/react-query";

export function useOutgoingTxHash(externalTxHash: string | null) {
  const result = useQuery({
    queryKey: ["outgoingTxHash", externalTxHash],
    queryFn: async () => {
      const response = await fetch(
        `https://tonapi.io/v2/traces/${externalTxHash}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const result = await response.json();
      if (!response.ok) {
        console.error("Error fetching transaction", result);
        throw new Error("Error fetching transaction", { cause: result });
      }
      return (result as any).transaction.hash as string;
    },
    enabled: externalTxHash !== null,
  });
  return result.data;
}
