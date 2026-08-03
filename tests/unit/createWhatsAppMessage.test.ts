import { createWhatsAppMessage } from "../../src/domain/services/createWhatsAppMessage";

describe("createWhatsAppMessage", () => {
  it("agrupa caixas e unidades", () => {
    const message = createWhatsAppMessage({
      supplierName: "Frigorífico Central",
      responsibleName: "João",
      items: [
        { id: "1", productId: "p1", productName: "Coxão mole", quantity: 2, unit: "BOX" },
        { id: "2", productId: "p2", productName: "Costela janela", quantity: 8, unit: "UNIT" }
      ]
    });

    expect(message).toContain("2 caixas de Coxão mole");
    expect(message).toContain("8 unidades de Costela janela");
  });

  it("rejeita pedido vazio", () => {
    expect(() => createWhatsAppMessage({ supplierName: "A", responsibleName: "B", items: [] }))
      .toThrow("Adicione pelo menos um produto.");
  });
});
