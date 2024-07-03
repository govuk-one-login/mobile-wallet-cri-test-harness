// import "dotenv/config";
import express, { Application, Request, Response } from "express";
import { getPortNumber } from "./config";
import {KeyLike, generateKeyPair} from "jose";
import {writeFileSync} from "fs";

let publicKey: KeyLike

const app: Application = express();
const port = getPortNumber();

app.get("/hello", async (_req: Request, res: Response) => {
    console.log("Ciao!");
    res.status(201).send("Hello World!")
});

const server = app
  .listen(port, async () => {
      ({publicKey} = await generateKeyPair('PS256'))
      console.log(publicKey)

      writeFileSync("results/privatekey","CONTENT HERE")

      console.log(`Server is running on port ${port}`);
  })
  .on("error", (error: Error) => {
    console.log(error, "Unable to start server");
  });

module.exports = server
