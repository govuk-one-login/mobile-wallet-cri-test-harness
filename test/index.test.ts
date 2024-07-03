// const request = require("supertest");
// const app = require("../src/index");
import "dotenv/config";
import {readFileSync} from "fs";

function callThat() {
    const data =  readFileSync("results/privatekey", 'utf8')
    console.log(data)
    return true
}

function callThis() {
    const { fork } = require('child_process');
    const subProcess = fork("../dist/src/index.js");
    subProcess.on('message', (message) => {
        console.log(`I get this from the son : ${message}`);
    });
    return true
}

describe("tests", () => {
    it("should callThis", async () => {
         expect(callThis()).toBe(true);
    });

    it("should callThat", async () => {
        expect(callThat()).toBe(false);
    });

    // afterAll(async () => {
    //     await app.close()
    // })
});
