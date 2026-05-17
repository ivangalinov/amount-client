import { IOperationImportRow } from "@/entities/operation/api/types";

export interface IEditableImportRow extends IOperationImportRow {
  localId: string;
  selected: boolean;
  categoryId: string;
  createdAt: string;
  title: string;
}
