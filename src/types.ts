export interface ColumnDesc {
  id: string;
  label: string;
  type: "string" | "number" | "categorical" | "date";
  domain?: [number, number];
  categories?: string[];
  color?: string;
  width?: number;
}
