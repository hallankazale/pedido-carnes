export type MeasurementUnit = "BOX" | "UNIT";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: MeasurementUnit;
}

export interface OrderDraft {
  supplierName: string;
  responsibleName: string;
  notes?: string;
  items: OrderItem[];
}
