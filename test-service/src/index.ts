import "dotenv/config";
import express, { Application, Request, Response } from "express";
import { getPortNumber } from "./config";

const app: Application = express();
const port = getPortNumber();

app.get("/hello", async (_req: Request, res: Response) => {
  res.send("Hello World!");
});

app
  .listen(port, () => {
    console.log(`Server is running on port ${port}`);
  })
  .on("error", (error: Error) => {
    console.log(error, "Unable to start server");
  });
