import type { MeasurementUnit, OrderDraft, OrderItem } from "../entities/Order";

const UNIT_LABELS: Record<MeasurementUnit, [string, string]> = {
  BOX: ["caixa", "caixas"],
  UNIT: ["unidade", "unidades"],
};

function formatItem(item: OrderItem): string {
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    throw new Error(`Quantidade inválida para ${item.productName}.`);
  }

  const label = UNIT_LABELS[item.unit][item.quantity === 1 ? 0 : 1];
  return `• ${item.quantity} ${label} de ${item.productName.trim()}`;
}

/**
 * Mantém o formato da mensagem separado da interface para permitir testes
 * unitários e futuras integrações sem duplicar regras de negócio.
 */
export function createWhatsAppMessage(order: OrderDraft): string {
  if (!order.supplierName.trim()) throw new Error("Fornecedor obrigatório.");
  if (!order.responsibleName.trim()) throw new Error("Responsável obrigatório.");
  if (order.items.length === 0) throw new Error("Adicione pelo menos um produto.");

  const boxes = order.items.filter((item) => item.unit === "BOX");
  const units = order.items.filter((item) => item.unit === "UNIT");
  const sections = ["*PEDIDO DE CARNES*", `Fornecedor: ${order.supplierName.trim()}`];

  if (boxes.length) sections.push(`*CAIXAS*\n${boxes.map(formatItem).join("\n")}`);
  if (units.length) sections.push(`*UNIDADES*\n${units.map(formatItem).join("\n")}`);
  if (order.notes?.trim()) sections.push(`Observação:\n${order.notes.trim()}`);

  sections.push(`Responsável: ${order.responsibleName.trim()}`);
  return sections.join("\n\n");
}
