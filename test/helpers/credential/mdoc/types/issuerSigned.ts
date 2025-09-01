import { Tag } from "cbor2";
import { NameSpace } from "./namespaces";
import {
  DrivingPrivileges,
  TaggedDrivingPrivileges,
} from "./drivingPrivileges";

export type IssuerAuth = [
  Uint8Array,
  Map<number, Uint8Array | [Uint8Array]>,
  Uint8Array,
  Uint8Array,
];

export interface IssuerSignedItem {
  digestID: number;
  elementIdentifier: string;
  elementValue: string | boolean | Uint8Array | DrivingPrivileges[];
  random: Uint8Array;
}

export interface TaggedIssuerSignedItem
  extends Omit<IssuerSignedItem, "elementValue"> {
  elementValue: string | boolean | Uint8Array | TaggedDrivingPrivileges[] | Tag;
}

export interface IssuerSigned {
  issuerAuth: IssuerAuth;
  nameSpaces: Record<NameSpace, IssuerSignedItem[]>;
}

export interface TaggedIssuerSigned extends Omit<IssuerSigned, "nameSpaces"> {
  nameSpaces: Record<NameSpace, Tag[]>;
}
