import express, { Application, Request, Response } from "express";
import { getPortNumber } from "./config";
// import {KeyLike, generateKeyPair} from "jose";
// import {writeFileSync} from "fs";

const app: Application = express();
const port = getPortNumber();

app.get("/hello", async (_req: Request, res: Response) => {
  res.status(200).send("Hello World!");
});

const server = app
  .listen(port, async () => {
    // const {publicKey, privateKey} = await generateKeyPair('PS256')
    // writeFileSync("results/privateKey","CONTENT HERE")

    console.log(`Server is running on port ${port}`);
  })
  .on("error", (error: Error) => {
    console.log(error, "Unable to start server");
  });

module.exports = server;
