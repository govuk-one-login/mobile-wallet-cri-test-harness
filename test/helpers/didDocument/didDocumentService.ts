import axios, { AxiosResponse } from "axios";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { didDocumentSchema } from "./didDocumentSchema";

interface DidDocument {
  "@context": string[];
  id: string;
  verificationMethod: VerificationMethod[];
  assertionMethod: string[];
}

interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk: PublicKeyJwk;
}

interface PublicKeyJwk {
  kty: string;
  kid: string;
  crv: string;
  x: string;
  y: string;
}

export class DidDocumentService {
  static #instance: DidDocumentService;
  private DID_DOCUMENT_PATH: string = ".well-known/did.json";
  private _publicKeys: PublicKeyJwk[] | undefined = undefined;

  private constructor() {}

  public static get instance(): DidDocumentService {
    if (!DidDocumentService.#instance) {
      DidDocumentService.#instance = new DidDocumentService();
    }
    return DidDocumentService.#instance;
  }

  get publicKeys(): PublicKeyJwk[] | undefined {
    return this._publicKeys;
  }

  async validate(criUrl: string, criDomain: string) {
    const response = await this.getDidDocument(criUrl);

    if (response.status !== 200) {
      throw new Error("INVALID_STATUS_CODE");
    }

    const didDocument: DidDocument = response.data;
    if (!didDocument) {
      throw new Error("INVALID_RESPONSE_DATA");
    }

    const ajv = new Ajv({ allErrors: true, verbose: false });
    addFormats(ajv, { formats: ["uri"] });

    const rulesValidator = ajv
      .addSchema(didDocumentSchema)
      .compile(didDocumentSchema);

    const isValidPayload = this.checkPayload(
      rulesValidator,
      didDocument,
      criDomain,
    );

    if (isValidPayload) {
      console.log("DID document complies with the schema");
      this.setPublicKeys(didDocument.verificationMethod);
      return true;
    } else {
      const message = rulesValidator.errors
        ? JSON.stringify(rulesValidator.errors)
        : "Invalid value found";
      console.log(`DID document does not comply with the schema: ${message}`);
      throw new Error("INVALID_DID_DOCUMENT");
    }
  }

  private checkPayload(
    rulesValidator: ValidateFunction,
    didDocument: DidDocument,
    criDomain: string,
  ) {
    if (!rulesValidator(didDocument)) {
      return false;
    }

    // When running the CRI and test harness locally, replace domain "host.docker.internal" with "localhost" to match CRI URL
    criDomain = criDomain.replace("host.docker.internal", "localhost");

    const controller = "did:web:" + criDomain;
    if (didDocument.id !== controller) {
      console.log(
        `Invalid "id" value in DID document. Should be ${controller} but found ${didDocument.id}`,
      );
      return false;
    }

    for (const item of didDocument.verificationMethod) {
      const id = controller + "#" + item.publicKeyJwk.kid;
      if (item.id !== id) {
        console.log(
          `Invalid "id" value in "verificationMethod". Should be ${id} but found ${item.id}`,
        );
        return false;
      }

      if (item.controller !== controller) {
        console.log(
          `Invalid "controller" value in "verificationMethod". Should be ${controller} but found ${item.controller}`,
        );
        return false;
      }

      if (!didDocument.assertionMethod.includes(id)) {
        console.log(
          `"id" ${id} is missing in "assertionMethod" ${didDocument.assertionMethod}`,
        );
        return false;
      }
    }

    return true;
  }

  private setPublicKeys(verificationMethod: VerificationMethod[]) {
    const publicKeys: PublicKeyJwk[] = [];
    for (const item of verificationMethod) {
      const jwk = item.publicKeyJwk;
      publicKeys.push(jwk);
    }

    this._publicKeys = publicKeys;
  }

  private async getDidDocument(domain): Promise<AxiosResponse> {
    try {
      const url = new URL(this.DID_DOCUMENT_PATH, domain).toString();
      return await axios.get(url);
    } catch (error) {
      console.log(`Error trying to fetch DID document: ${error}`);
      throw new Error("GET_DID_DOCUMENT_ERROR");
    }
  }
}
