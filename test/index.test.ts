import "dotenv/config";
// import {readFileSync} from "fs";

function callThat() {
  // const data =  readFileSync("results/privateKey", 'utf8')
  return true;
}

function callThis() {
  return true;
}

describe("tests", () => {
  it("should callThis and return true", async () => {
    expect(callThis()).toBe(true);
  });

  it("should callThat and return false", async () => {
    expect(callThat()).toBe(false);
  });
});
