export type OrderUnit = "BOX" | "UNIT";

export interface OrderMessageItem {
  productName: string;
  category: string;
  quantity: number;
  unit: OrderUnit;
}

const UNIT_LABELS: Record<OrderUnit, { singular: string; plural: string }> = {
  BOX: { singular: "caixa", plural: "caixas" },
  UNIT: { singular: "unidade", plural: "unidades" },
};

function formatItem(item: OrderMessageItem): string {
  const labels = UNIT_LABELS[item.unit];
  const unitLabel = item.quantity === 1 ? labels.singular : labels.plural;
  return `• ${item.quantity} ${unitLabel} de ${item.productName}`;
}

/**
 * Mantém a formatação do pedido isolada da interface para facilitar testes,
 * mudanças futuras de canal e evitar mensagens inconsistentes.
 */
export function buildOrderMessage(input: {
  supplierName: string;
  responsibleName: string;
  notes?: string;
  items: OrderMessageItem[];
}): string {
  if (!input.items.length) {
    throw new Error("O pedido precisa ter pelo menos um produto.");
  }

  const groupedItems = input.items.reduce<Record<string, OrderMessageItem[]>>(
    (groups, item) => {
      const category = item.category.trim().toUpperCase() || "OUTROS";
      groups[category] ??= [];
      groups[category].push(item);
      return groups;
    },
    {},
  );

  const sections = Object.entries(groupedItems).map(([category, items]) => {
    return `*${category}*\n${items.map(formatItem).join("\n")}`;
  });

  return [
    "*PEDIDO DE CARNES*",
    `Fornecedor: ${input.supplierName.trim()}`,
    ...sections,
    input.notes?.trim() ? `Observação:\n${input.notes.trim()}` : undefined,
    `Responsável: ${input.responsibleName.trim()}`,
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n\n");
}

/** Adiciona o código do Brasil quando o número foi salvo apenas com DDD. */
export function normalizeBrazilianWhatsApp(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}
