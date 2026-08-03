import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createProduct,
  createSupplier,
  initializeDatabase,
  listProducts,
  listSuppliers,
  ProductRecord,
  SupplierRecord,
} from "./src/infrastructure/database/database";
import {
  buildOrderMessage,
  normalizeBrazilianWhatsApp,
  OrderUnit,
} from "./src/domain/order/orderMessage";

type Screen = "home" | "suppliers" | "products" | "orderSupplier" | "orderItems" | "orderReview";

type DraftItem = {
  product: ProductRecord;
  unit: OrderUnit;
  quantity: number;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [isReady, setIsReady] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRecord | null>(null);
  const [draftItems, setDraftItems] = useState<Record<string, DraftItem>>({});
  const [responsibleName, setResponsibleName] = useState("");
  const [notes, setNotes] = useState("");

  async function refreshData(): Promise<void> {
    const [supplierRows, productRows] = await Promise.all([listSuppliers(), listProducts()]);
    setSuppliers(supplierRows);
    setProducts(productRows);
  }

  useEffect(() => {
    void (async () => {
      try {
        await initializeDatabase();
        await refreshData();
        setIsReady(true);
      } catch {
        Alert.alert("Erro", "Não foi possível iniciar o banco offline.");
      }
    })();
  }, []);

  function startOrder(): void {
    if (!suppliers.length) {
      Alert.alert("Cadastre um fornecedor", "É necessário ter pelo menos um fornecedor antes de criar o pedido.");
      return;
    }
    if (!products.length) {
      Alert.alert("Cadastre um produto", "É necessário ter pelo menos uma carne cadastrada antes de criar o pedido.");
      return;
    }
    setSelectedSupplier(null);
    setDraftItems({});
    setNotes("");
    setScreen("orderSupplier");
  }

  function changeQuantity(product: ProductRecord, unit: OrderUnit, delta: number): void {
    const key = `${product.id}-${unit}`;
    setDraftItems((current) => {
      const previous = current[key]?.quantity ?? 0;
      const quantity = Math.max(0, Math.min(999, previous + delta));
      if (quantity === 0) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: { product, unit, quantity } };
    });
  }

  const selectedItems = useMemo(() => Object.values(draftItems), [draftItems]);

  async function sendOrder(): Promise<void> {
    if (!selectedSupplier) return;
    if (responsibleName.trim().length < 2) {
      Alert.alert("Responsável obrigatório", "Informe o nome de quem está fazendo o pedido.");
      return;
    }

    const message = buildOrderMessage({
      supplierName: selectedSupplier.name,
      responsibleName,
      notes,
      items: selectedItems.map((item) => ({
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        unit: item.unit,
      })),
    });

    const phone = normalizeBrazilianWhatsApp(selectedSupplier.whatsapp);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("WhatsApp indisponível", "Não foi possível abrir o WhatsApp neste aparelho.");
    }
  }

  if (!isReady) {
    return <SafeAreaView style={styles.container}><View style={styles.centered}><Text style={styles.title}>Preparando aplicativo...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {screen === "home" && (
        <HomeScreen
          supplierCount={suppliers.length}
          productCount={products.length}
          onNewOrder={startOrder}
          onOpenSuppliers={() => setScreen("suppliers")}
          onOpenProducts={() => setScreen("products")}
        />
      )}
      {screen === "suppliers" && <SuppliersScreen suppliers={suppliers} onBack={() => setScreen("home")} onCreated={refreshData} />}
      {screen === "products" && <ProductsScreen products={products} onBack={() => setScreen("home")} onCreated={refreshData} />}
      {screen === "orderSupplier" && (
        <SupplierSelectionScreen
          suppliers={suppliers}
          selectedSupplier={selectedSupplier}
          onSelect={setSelectedSupplier}
          onBack={() => setScreen("home")}
          onContinue={() => selectedSupplier ? setScreen("orderItems") : Alert.alert("Escolha um fornecedor")}
        />
      )}
      {screen === "orderItems" && selectedSupplier && (
        <OrderItemsScreen
          supplier={selectedSupplier}
          products={products}
          draftItems={draftItems}
          onChangeQuantity={changeQuantity}
          onBack={() => setScreen("orderSupplier")}
          onContinue={() => selectedItems.length ? setScreen("orderReview") : Alert.alert("Pedido vazio", "Adicione pelo menos um produto.")}
        />
      )}
      {screen === "orderReview" && selectedSupplier && (
        <OrderReviewScreen
          supplier={selectedSupplier}
          items={selectedItems}
          responsibleName={responsibleName}
          notes={notes}
          onResponsibleChange={setResponsibleName}
          onNotesChange={setNotes}
          onBack={() => setScreen("orderItems")}
          onSend={() => void sendOrder()}
        />
      )}
    </SafeAreaView>
  );
}

function HomeScreen(props: { supplierCount: number; productCount: number; onNewOrder: () => void; onOpenSuppliers: () => void; onOpenProducts: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>PEDIDOS DO AÇOUGUE</Text>
      <Text style={styles.title}>Pedido de Carnes</Text>
      <Text style={styles.subtitle}>Monte o pedido em poucos toques e envie a mensagem pronta ao fornecedor.</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={props.onNewOrder}><Text style={styles.primaryButtonText}>+ Novo pedido</Text></TouchableOpacity>
      <View style={styles.grid}>
        <MenuCard title="Fornecedores" description={`${props.supplierCount} cadastrado(s)`} onPress={props.onOpenSuppliers} />
        <MenuCard title="Produtos" description={`${props.productCount} cadastrado(s)`} onPress={props.onOpenProducts} />
      </View>
    </ScrollView>
  );
}

function SupplierSelectionScreen(props: { suppliers: SupplierRecord[]; selectedSupplier: SupplierRecord | null; onSelect: (supplier: SupplierRecord) => void; onBack: () => void; onContinue: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="Escolha o fornecedor" onBack={props.onBack} />
      <Text style={styles.subtitle}>O WhatsApp cadastrado será usado no envio.</Text>
      {props.suppliers.map((supplier) => {
        const selected = props.selectedSupplier?.id === supplier.id;
        return (
          <TouchableOpacity key={supplier.id} style={[styles.listItem, selected && styles.selectedCard]} onPress={() => props.onSelect(supplier)}>
            <Text style={styles.listItemTitle}>{selected ? "✓ " : ""}{supplier.name}</Text>
            <Text style={styles.listItemDescription}>{supplier.whatsapp}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity style={styles.primaryButton} onPress={props.onContinue}><Text style={styles.primaryButtonText}>Continuar</Text></TouchableOpacity>
    </ScrollView>
  );
}

function OrderItemsScreen(props: { supplier: SupplierRecord; products: ProductRecord[]; draftItems: Record<string, DraftItem>; onChangeQuantity: (product: ProductRecord, unit: OrderUnit, delta: number) => void; onBack: () => void; onContinue: () => void }) {
  const categories = Array.from(new Set(props.products.map((product) => product.category)));
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader title="Adicionar carnes" onBack={props.onBack} />
      <Text style={styles.subtitle}>Fornecedor: {props.supplier.name}</Text>
      {categories.map((category) => (
        <View key={category} style={styles.categoryBlock}>
          <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>
          {props.products.filter((product) => product.category === category).map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Text style={styles.listItemTitle}>{product.name}</Text>
              {product.allows_box ? <QuantityRow label="Caixas" quantity={props.draftItems[`${product.id}-BOX`]?.quantity ?? 0} onMinus={() => props.onChangeQuantity(product, "BOX", -1)} onPlus={() => props.onChangeQuantity(product, "BOX", 1)} /> : null}
              {product.allows_unit ? <QuantityRow label="Unidades" quantity={props.draftItems[`${product.id}-UNIT`]?.quantity ?? 0} onMinus={() => props.onChangeQuantity(product, "UNIT", -1)} onPlus={() => props.onChangeQuantity(product, "UNIT", 1)} /> : null}
            </View>
          ))}
        </View>
      ))}
      <TouchableOpacity style={styles.primaryButton} onPress={props.onContinue}><Text style={styles.primaryButtonText}>Revisar pedido</Text></TouchableOpacity>
    </ScrollView>
  );
}

function QuantityRow(props: { label: string; quantity: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.quantityRow}>
      <Text style={styles.quantityLabel}>{props.label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepButton} onPress={props.onMinus}><Text style={styles.stepText}>−</Text></TouchableOpacity>
        <Text style={styles.quantityValue}>{props.quantity}</Text>
        <TouchableOpacity style={styles.stepButton} onPress={props.onPlus}><Text style={styles.stepText}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function OrderReviewScreen(props: { supplier: SupplierRecord; items: DraftItem[]; responsibleName: string; notes: string; onResponsibleChange: (value: string) => void; onNotesChange: (value: string) => void; onBack: () => void; onSend: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Revisar pedido" onBack={props.onBack} />
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>{props.supplier.name}</Text>
        {props.items.map((item) => <Text key={`${item.product.id}-${item.unit}`} style={styles.summaryLine}>• {item.quantity} {item.unit === "BOX" ? (item.quantity === 1 ? "caixa" : "caixas") : (item.quantity === 1 ? "unidade" : "unidades")} de {item.product.name}</Text>)}
      </View>
      <TextInput style={styles.input} placeholder="Nome do responsável" value={props.responsibleName} onChangeText={props.onResponsibleChange} />
      <TextInput style={[styles.input, styles.notesInput]} placeholder="Observação opcional" multiline value={props.notes} onChangeText={props.onNotesChange} />
      <TouchableOpacity style={styles.whatsappButton} onPress={props.onSend}><Text style={styles.primaryButtonText}>Enviar pelo WhatsApp</Text></TouchableOpacity>
      <Text style={styles.helperText}>O pedido é montado offline. A internet só é necessária para o WhatsApp enviar a mensagem.</Text>
    </ScrollView>
  );
}

function MenuCard(props: { title: string; description: string; onPress: () => void }) { return <TouchableOpacity style={styles.card} onPress={props.onPress}><Text style={styles.cardTitle}>{props.title}</Text><Text style={styles.cardDescription}>{props.description}</Text></TouchableOpacity>; }
function ScreenHeader(props: { title: string; onBack: () => void }) { return <View style={styles.header}><TouchableOpacity onPress={props.onBack} style={styles.backButton}><Text style={styles.backButtonText}>‹</Text></TouchableOpacity><Text style={styles.headerTitle}>{props.title}</Text></View>; }

function SuppliersScreen(props: { suppliers: SupplierRecord[]; onBack: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(""); const [whatsapp, setWhatsapp] = useState("");
  async function handleCreate(): Promise<void> { if (name.trim().length < 2 || whatsapp.replace(/\D/g, "").length < 10) { Alert.alert("Dados incompletos", "Informe o nome e um WhatsApp válido."); return; } await createSupplier(name, whatsapp); setName(""); setWhatsapp(""); await props.onCreated(); }
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenHeader title="Fornecedores" onBack={props.onBack} /><TextInput style={styles.input} placeholder="Nome do fornecedor" value={name} onChangeText={setName} /><TextInput style={styles.input} placeholder="WhatsApp com DDD" keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} /><TouchableOpacity style={styles.primaryButton} onPress={() => void handleCreate()}><Text style={styles.primaryButtonText}>Salvar fornecedor</Text></TouchableOpacity><Text style={styles.sectionTitle}>Cadastrados</Text>{props.suppliers.map((supplier) => <View key={supplier.id} style={styles.listItem}><Text style={styles.listItemTitle}>{supplier.name}</Text><Text style={styles.listItemDescription}>{supplier.whatsapp}</Text></View>)}</ScrollView>;
}

function ProductsScreen(props: { products: ProductRecord[]; onBack: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState(""); const [category, setCategory] = useState("Caixaria"); const [allowsBox, setAllowsBox] = useState(true); const [allowsUnit, setAllowsUnit] = useState(false);
  async function handleCreate(): Promise<void> { if (name.trim().length < 2 || category.trim().length < 2) { Alert.alert("Dados incompletos", "Informe o produto e a categoria."); return; } if (!allowsBox && !allowsUnit) { Alert.alert("Unidade obrigatória", "Marque caixa, unidade ou as duas opções."); return; } await createProduct({ name, category, allowsBox, allowsUnit }); setName(""); await props.onCreated(); }
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenHeader title="Produtos" onBack={props.onBack} /><TextInput style={styles.input} placeholder="Nome da carne" value={name} onChangeText={setName} /><TextInput style={styles.input} placeholder="Categoria" value={category} onChangeText={setCategory} /><View style={styles.optionRow}><OptionButton label="Caixa" selected={allowsBox} onPress={() => setAllowsBox(!allowsBox)} /><OptionButton label="Unidade" selected={allowsUnit} onPress={() => setAllowsUnit(!allowsUnit)} /></View><TouchableOpacity style={styles.primaryButton} onPress={() => void handleCreate()}><Text style={styles.primaryButtonText}>Salvar produto</Text></TouchableOpacity><Text style={styles.sectionTitle}>Cadastrados</Text>{props.products.map((product) => <View key={product.id} style={styles.listItem}><Text style={styles.listItemTitle}>{product.name}</Text><Text style={styles.listItemDescription}>{product.category} · {product.allows_box ? "Caixa" : ""}{product.allows_box && product.allows_unit ? " e " : ""}{product.allows_unit ? "Unidade" : ""}</Text></View>)}</ScrollView>;
}
function OptionButton(props: { label: string; selected: boolean; onPress: () => void }) { return <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: props.selected }} style={[styles.optionButton, props.selected && styles.optionButtonSelected]} onPress={props.onPress}><Text style={[styles.optionText, props.selected && styles.optionTextSelected]}>{props.selected ? "✓ " : ""}{props.label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1" }, centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }, content: { flexGrow: 1, padding: 22, paddingBottom: 40, gap: 14 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: "#68717B" }, title: { fontSize: 34, lineHeight: 40, fontWeight: "900", color: "#1C252E" }, subtitle: { fontSize: 16, lineHeight: 24, color: "#5D6873" },
  primaryButton: { minHeight: 56, borderRadius: 16, backgroundColor: "#8B1E2D", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, whatsappButton: { minHeight: 58, borderRadius: 16, backgroundColor: "#167C4A", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, primaryButtonText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  grid: { gap: 12, marginTop: 6 }, card: { minHeight: 100, borderRadius: 18, padding: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E0D8", justifyContent: "center" }, selectedCard: { borderColor: "#8B1E2D", backgroundColor: "#F8EDEF" }, cardTitle: { fontSize: 19, fontWeight: "800", color: "#1C252E" }, cardDescription: { marginTop: 5, fontSize: 14, color: "#68717B" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }, backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }, backButtonText: { fontSize: 34, lineHeight: 36, color: "#1C252E" }, headerTitle: { flex: 1, fontSize: 27, fontWeight: "900", color: "#1C252E" },
  input: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: "#D8D5CB", backgroundColor: "#FFFFFF", paddingHorizontal: 16, fontSize: 16, color: "#1C252E" }, notesInput: { minHeight: 100, paddingTop: 15, textAlignVertical: "top" }, optionRow: { flexDirection: "row", gap: 10 }, optionButton: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#CFCBC0", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, optionButtonSelected: { backgroundColor: "#F3E3E6", borderColor: "#8B1E2D" }, optionText: { fontSize: 15, fontWeight: "700", color: "#5D6873" }, optionTextSelected: { color: "#8B1E2D" },
  sectionTitle: { marginTop: 10, fontSize: 17, fontWeight: "900", color: "#1C252E" }, listItem: { borderRadius: 15, backgroundColor: "#FFFFFF", padding: 16, borderWidth: 1, borderColor: "#E2E0D8" }, listItemTitle: { fontSize: 16, fontWeight: "800", color: "#1C252E" }, listItemDescription: { marginTop: 4, fontSize: 14, color: "#68717B" },
  categoryBlock: { gap: 10 }, productCard: { borderRadius: 16, backgroundColor: "#FFFFFF", padding: 16, borderWidth: 1, borderColor: "#E2E0D8", gap: 10 }, quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, quantityLabel: { fontSize: 15, color: "#5D6873" }, stepper: { flexDirection: "row", alignItems: "center", gap: 12 }, stepButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#F0EEE8", alignItems: "center", justifyContent: "center" }, stepText: { fontSize: 25, fontWeight: "800", color: "#8B1E2D" }, quantityValue: { width: 34, textAlign: "center", fontSize: 18, fontWeight: "900", color: "#1C252E" },
  summaryCard: { borderRadius: 18, padding: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E0D8", gap: 9 }, summaryLine: { fontSize: 15, lineHeight: 22, color: "#35404A" }, helperText: { textAlign: "center", fontSize: 13, lineHeight: 19, color: "#68717B" },
});
