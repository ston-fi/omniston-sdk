function nftPreviewUrl(nftAddress: string) {
  return new URL(`https://getgems.io/nft/${nftAddress}`);
}

const explorer = {
  nftPreviewUrl,
};

export function useExplorer() {
  return explorer;
}
