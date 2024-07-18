import express, { Application, Request, Response } from "express";
import { getKeyId, getPortNumber } from "./config";
import { generateKeyPair, exportJWK, JWK } from "jose";
import { writeFileSync } from "fs";

const app: Application = express();
const port = getPortNumber();

let publicKey;

app.get("/.well-known/jwks.json", async (_req: Request, res: Response) => {
  const jwks: JWK[] = [];
  // add 'kid' to JWK
  publicKey.kid = getKeyId();
  jwks.push(publicKey);

  res.status(200).json({ keys: jwks });
});

const server = app
  .listen(port, async () => {
    console.log(`Server is running on port ${port}`);

    const keyPair = await generateKeyPair("ES256", {
      extractable: true,
    });

    const privateKey = await exportJWK(keyPair.privateKey);
    writeFileSync("test/helpers/sts/privateKey", JSON.stringify(privateKey));

    publicKey = await exportJWK(keyPair.publicKey);
    console.log("Public key:", publicKey);
  })
  .on("error", (error: Error) => {
    console.log(error, "Unable to start server");
  });

module.exports = server;
