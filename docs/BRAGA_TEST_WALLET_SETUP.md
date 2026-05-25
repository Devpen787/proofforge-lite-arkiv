# Braga Test Wallet Setup

Public-safe setup notes for the wallet used in the ProofForge Lite live demo.
The project owner should control this wallet. Do not put wallet recovery
material, private signing data, browser profile data, or faucet credentials in
this repository.

## Recommended Wallet

Use a fresh EVM browser wallet account, preferably in a separate browser profile
used only for this challenge.

Recommended path:

1. Install or open MetaMask in a clean browser profile.
2. Create a new account that has never held mainnet funds.
3. Save recovery material outside the repository and outside the ProofForge
   workspace.
4. Copy only the public `0x...` address into the Approval 1 reply block.
5. Use this wallet only for Braga testnet writes during the approved cutover.

## Braga Network

The app can request the Braga network through the browser wallet. If manual
network review is needed, use Arkiv's current Braga values:

```text
Network name: Braga
Chain ID: 60138453102
Chain ID hex: 0xe0087f86e
RPC URL: https://braga.hoodi.arkiv.network/rpc
Explorer: https://explorer.braga.hoodi.arkiv.network
Native token: test GLM
```

## Faucet

Use the Arkiv faucet only after Approval 1 allows faucet use. The faucet should
receive the public burner address only.

```text
https://infurademo.hoodi.arkiv.network/faucet/
```

## What Approval 1 Needs

Approval 1 should include:

- approved public EVM address;
- confirmation that the wallet is public-safe for challenge evidence;
- confirmation that it will be used only on Braga for this cutover;
- confirmation that no wallet recovery material or signing data will be stored
  in the repo or private workspace;
- faucet approval if Braga test GLM is needed;
- 3-minute screen-share constraint acceptance;
- team location, entrant status, representative contact fields, GitHub handle,
  and showcase consent.

Approval 1 does not authorize final Network School or Arkiv form submission.
