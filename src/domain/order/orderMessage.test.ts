import { buildOrderMessage, normalizeBrazilianWhatsApp } from "./orderMessage";

describe("buildOrderMessage", () => {
  it("agrupa produtos por categoria e pluraliza as unidades", () => {
    const message = buildOrderMessage({
      supplierName: "Frigorífico Central",
      responsibleName: "João",
      items: [
        { productName: "Coxão mole", category: "Caixaria", quantity: 2, unit: "BOX" },
        { productName: "Costela janela", category: "Costelas", quantity: 1, unit: "UNIT" },
      ],
    });

    expect(message).toContain("*CAIXARIA*");
    expect(message).toContain("• 2 caixas de Coxão mole");
    expect(message).toContain("• 1 unidade de Costela janela");
    expect(message).toContain("Responsável: João");
  });

  it("rejeita pedido vazio", () => {
    expect(() =>
      buildOrderMessage({ supplierName: "Fornecedor", responsibleName: "João", items: [] }),
    ).toThrow("pelo menos um produto");
  });
});

describe("normalizeBrazilianWhatsApp", () => {
  it("adiciona o código 55 a números com DDD", () => {
    expect(normalizeBrazilianWhatsApp("(47) 99999-8888")).toBe("5547999998888");
  });

  it("preserva números que já possuem código do país", () => {
    expect(normalizeBrazilianWhatsApp("55 47 99999-8888")).toBe("5547999998888");
  });
});
