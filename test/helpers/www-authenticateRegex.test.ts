describe("www-authenticate regex", () => {
    const regex = /^Bearer(?: realm="[^"]+")? error="invalid_token"$/;

    it("should match without realm", () => {
        expect("Bearer error=\"invalid_token\"").toMatch(regex);
    });

    it("should match with realm", () => {
        expect("Bearer realm=\"CREDENTIAL_ISSUER_URL\" error=\"invalid_token\"").toMatch(regex);
    })

    it("should not match if realm is empty", () => {
        expect("Bearer realm=\"\" error=\"invalid_token\"").not.toMatch(regex);
    })
});