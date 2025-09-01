import { Tag } from "cbor2";

export interface DrivingPrivileges {
  vehicleCategoryCode: string;
  issue_date?: string;
  expiry_date?: string;
}

export interface TaggedDrivingPrivileges
  extends Omit<DrivingPrivileges, "issue_date" | "expiry_date"> {
  issue_date?: Tag;
  expiry_date?: Tag;
}
