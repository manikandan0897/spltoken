// No imports needed: web3, anchor, pg and more are globally available
import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import assert from "assert";
import BN from "bn.js";

import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';


describe("Test", () => {

   const METADATA_SEED = "metadata";
    const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );
  
    const MINT_SEED = "mint";
    const payer = pg.program.provider.publicKey;
    const metadata = {
      name: "Arunpadiyan",
      symbol: "ARUN",
      uri: "https://teal-added-salamander-615.mypinata.cloud/ipfs/bafkreidc3sm7c27v3bajay6wlyk6s4zuye6ljjauoamp4mg6dzjsh4wvpy",
      decimals: 9
    }
    const mintAmount = 100000;
  
    const [mint] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from(MINT_SEED)],
      pg.program.programId
    );
  
    const [metadataAddress] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from(METADATA_SEED),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

  it("initialize", async () => {
     const info = await pg.program.provider.connection.getAccountInfo(mint);
      if (info) {
        return; // Do not attempt to initialize if already initialized
      }
      console.log("  Mint not found. Initializing Program...");
  
      const context = {
        metadata: metadataAddress,
        mint,
        payer,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      };
  
  
      const txHash = await pg.program.methods
        .initToken(metadata)
        .accounts(context)
        .rpc();

      console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
      const newInfo = await pg.program.provider.connection.getAccountInfo(mint);
      assert(newInfo, "  Mint should be initialized.");
  });


  it("mint tokens", async () => {
    const destination = await anchor.utils.token.associatedAddress({
      mint: mint,
      owner: payer,
    });

    let initialBalance: number;

    try {
      const balance = await pg.program.provider.connection.getTokenAccountBalance(destination);
      initialBalance = balance.value.uiAmount;
    } catch {
      // Token account not yet initiated has 0 balance
      initialBalance = 0;
    }

    const context = {
      mint,
      destination,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    };

    const txHash = await pg.program.methods
      .mintTokens(new BN(mintAmount * 10 ** metadata.decimals))
      .accounts(context)
      .rpc();
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  });

  it("Token transfer",async() => {
    const sourceaccount = await anchor.utils.token.associatedAddress({
      mint: mint,
      owner: payer,
    });
    const context = {
      mintToken: mint,
      fromAccount:sourceaccount,
      signer: payer,
      toAccount: sourceaccount,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associateTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    }
    const transfertx = await pg.program.methods
      .transerToken(new BN(1*10**metadata.decimals))
      .accounts(context)
      .rpc()
    console.log(`  https://explorer.solana.com/tx/${transfertx}?cluster=devnet`);
  })
});
