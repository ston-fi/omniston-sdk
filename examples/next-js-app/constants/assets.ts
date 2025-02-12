/** Represents an asset */
export interface AssetInfo {
  /** Address of the asset in corresponding blockchain */
  address: string;
  /** Asset symbol */
  symbol: string;
  /** Human-readable name */
  name: string;
  /** URL to asset image */
  imageUrl: string;
  /** Number of decimal places */
  decimals: number;
}

// Demo app only. In real code, you should fetch this data from a decentralised exchange or a token price tracking service.
export const STATIC_ASSETS: AssetInfo[] = [
  {
    address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    symbol: "TON",
    name: "TON",
    imageUrl:
      "https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/ee9fb21d17bc8d75c2a5f7b5f5f62d2bacec6b128f58b63cb841e98f7b74c4fc",
    decimals: 9,
  },
  {
    address: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
    symbol: "STON",
    name: "STON",
    imageUrl:
      "https://asset.ston.fi/img/EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO/114bca17656d32bab17da0ced9bc044a50c849c949907c60af990c6818045c6d",
    decimals: 9,
  },
  {
    address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    symbol: "USD₮",
    name: "Tether USD",
    imageUrl:
      "https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/3c568dd0c7f9b8874fe1aba3d318d38437615f06b01a46618bfe3c0eee5fe37f",
    decimals: 6,
  },
  {
    address: "EQB420yQsZobGcy0VYDfSKHpG2QQlw-j1f_tPu1J488I__PX",
    symbol: "PX",
    name: "PX",
    imageUrl:
      "https://asset.ston.fi/img/EQB420yQsZobGcy0VYDfSKHpG2QQlw-j1f_tPu1J488I__PX/bbb51b3ab9e2d1d15f027164fb4b0f3d70cf3a45709e9ecdd4cad0e78af16aa3",
    decimals: 9,
  },
  {
    address: "EQBadq9p12uC1KfSiPCAaoEvhpXPHj7hBWq-mqGntuwE2C1C",
    symbol: "CATS",
    name: "TON Cats Jetton",
    imageUrl:
      "https://asset.ston.fi/img/EQBadq9p12uC1KfSiPCAaoEvhpXPHj7hBWq-mqGntuwE2C1C/13f9732939e0c002ad2091267be771bc9b5c201392d93ae2a3b34a7479559a90",
    decimals: 9,
  },
  {
    address: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
    symbol: "NOT",
    name: "Notcoin",
    imageUrl:
      "https://asset.ston.fi/img/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT/2d92c8245aa44315ae8ccb47c7522ab96bc782fecd523a0df8742a1a0a4de7b4",
    decimals: 9,
  },
  {
    address: "EQB8O0JJ-hqeDAqDC1OG6zPYBfpV-QzwPed0kpcbILXsmAxG",
    symbol: "GEM",
    name: "Gem",
    imageUrl:
      "https://asset.ston.fi/img/EQB8O0JJ-hqeDAqDC1OG6zPYBfpV-QzwPed0kpcbILXsmAxG/056c4e6d08e9b413c2d9e34b210c6b9cb59da2cc9ae9e91bb906bec5926b9091",
    decimals: 9,
  },
  {
    address: "EQBsosmcZrD6FHijA7qWGLw5wo_aH8UN435hi935jJ_STORM",
    symbol: "STORM",
    name: "STORM",
    imageUrl:
      "https://asset.ston.fi/img/EQBsosmcZrD6FHijA7qWGLw5wo_aH8UN435hi935jJ_STORM/1b091aeb9bd5bff5656ad19aa7390c09519b11b3836fcaf0c06deaf1eb278801",
    decimals: 9,
  },
  {
    address: "EQBYnUrIlwBrWqp_rl-VxeSBvTR2VmTfC4ManQ657n_BUILD",
    symbol: "BUILD",
    name: "BUILD",
    imageUrl:
      "https://asset.ston.fi/img/EQBYnUrIlwBrWqp_rl-VxeSBvTR2VmTfC4ManQ657n_BUILD/33423c4eb6175745c7fe64b5c49ea6cb0def9eb3c0c6e5ed9578ca0191c4853a",
    decimals: 9,
  },
  {
    address: "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",
    symbol: "DUST",
    name: "DeDust",
    imageUrl: "https://assets.dedust.io/images/dust.gif",
    decimals: 9,
  },
];
