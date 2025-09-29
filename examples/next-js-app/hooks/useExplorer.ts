function addressPreviewUrl(address: string) {
  return new URL(`https://tonviewer.com/${address}`);
}

const explorer = {
  addressPreviewUrl,
};

export function useExplorer() {
  return explorer;
}
