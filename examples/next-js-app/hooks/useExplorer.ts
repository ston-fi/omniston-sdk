const baseUrl = "https://tonviewer.com";

function addressPreviewUrl(address: string) {
  return new URL(`${baseUrl}/${address}`);
}

function transactionPreviewUrl(txId: string) {
  return new URL(`${baseUrl}/transaction/${txId}`);
}

const explorer = {
  addressPreviewUrl,
  transactionPreviewUrl,
};

export function useExplorer() {
  return explorer;
}
