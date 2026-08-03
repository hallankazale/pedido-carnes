import { useEffect, useState } from "react";
import {
  Alert,
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

type Screen = "home" | "suppliers" | "products";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [isReady, setIsReady] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);

  async function refreshData(): Promise<void> {
    const [supplierRows, productRows] = await Promise.all([
      listSuppliers(),
      listProducts(),
    ]);
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

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Preparando aplicativo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {screen === "home" && (
        <HomeScreen
          supplierCount={suppliers.length}
          productCount={products.length}
          onOpenSuppliers={() => setScreen("suppliers")}
          onOpenProducts={() => setScreen("products")}
        />
      )}

      {screen === "suppliers" && (
        <SuppliersScreen
          suppliers={suppliers}
          onBack={() => setScreen("home")}
          onCreated={refreshData}
        />
      )}

      {screen === "products" && (
        <ProductsScreen
          products={products}
          onBack={() => setScreen("home")}
          onCreated={refreshData}
        />
      )}
    </SafeAreaView>
  );
}

function HomeScreen(props: {
  supplierCount: number;
  productCount: number;
  onOpenSuppliers: () => void;
  onOpenProducts: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>PEDIDOS DO AÇOUGUE</Text>
      <Text style={styles.title}>Pedido de Carnes</Text>
      <Text style={styles.subtitle}>
        Cadastre os fornecedores e as carnes. Tudo fica salvo no celular e funciona sem internet.
      </Text>

      <TouchableOpacity style={styles.primaryButton} disabled>
        <Text style={styles.primaryButtonText}>Novo pedido — próxima etapa</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        <MenuCard
          title="Fornecedores"
          description={`${props.supplierCount} cadastrado(s)`}
          onPress={props.onOpenSuppliers}
        />
        <MenuCard
          title="Produtos"
          description={`${props.productCount} cadastrado(s)`}
          onPress={props.onOpenProducts}
        />
      </View>
    </ScrollView>
  );
}

function MenuCard(props: { title: string; description: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={props.onPress}>
      <Text style={styles.cardTitle}>{props.title}</Text>
      <Text style={styles.cardDescription}>{props.description}</Text>
    </TouchableOpacity>
  );
}

function ScreenHeader(props: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={props.onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{props.title}</Text>
    </View>
  );
}

function SuppliersScreen(props: {
  suppliers: SupplierRecord[];
  onBack: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  async function handleCreate(): Promise<void> {
    if (name.trim().length < 2 || whatsapp.replace(/\D/g, "").length < 10) {
      Alert.alert("Dados incompletos", "Informe o nome e um WhatsApp válido.");
      return;
    }

    await createSupplier(name, whatsapp);
    setName("");
    setWhatsapp("");
    await props.onCreated();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Fornecedores" onBack={props.onBack} />
      <TextInput style={styles.input} placeholder="Nome do fornecedor" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="WhatsApp com DDD"
        keyboardType="phone-pad"
        value={whatsapp}
        onChangeText={setWhatsapp}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={() => void handleCreate()}>
        <Text style={styles.primaryButtonText}>Salvar fornecedor</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Cadastrados</Text>
      {props.suppliers.map((supplier) => (
        <View key={supplier.id} style={styles.listItem}>
          <Text style={styles.listItemTitle}>{supplier.name}</Text>
          <Text style={styles.listItemDescription}>{supplier.whatsapp}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ProductsScreen(props: {
  products: ProductRecord[];
  onBack: () => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Caixaria");
  const [allowsBox, setAllowsBox] = useState(true);
  const [allowsUnit, setAllowsUnit] = useState(false);

  async function handleCreate(): Promise<void> {
    if (name.trim().length < 2 || category.trim().length < 2) {
      Alert.alert("Dados incompletos", "Informe o produto e a categoria.");
      return;
    }

    if (!allowsBox && !allowsUnit) {
      Alert.alert("Unidade obrigatória", "Marque caixa, unidade ou as duas opções.");
      return;
    }

    await createProduct({ name, category, allowsBox, allowsUnit });
    setName("");
    await props.onCreated();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Produtos" onBack={props.onBack} />
      <TextInput style={styles.input} placeholder="Nome da carne" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Categoria" value={category} onChangeText={setCategory} />

      <View style={styles.optionRow}>
        <OptionButton label="Caixa" selected={allowsBox} onPress={() => setAllowsBox(!allowsBox)} />
        <OptionButton label="Unidade" selected={allowsUnit} onPress={() => setAllowsUnit(!allowsUnit)} />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => void handleCreate()}>
        <Text style={styles.primaryButtonText}>Salvar produto</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Cadastrados</Text>
      {props.products.map((product) => (
        <View key={product.id} style={styles.listItem}>
          <Text style={styles.listItemTitle}>{product.name}</Text>
          <Text style={styles.listItemDescription}>
            {product.category} · {product.allows_box ? "Caixa" : ""}
            {product.allows_box && product.allows_unit ? " e " : ""}
            {product.allows_unit ? "Unidade" : ""}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function OptionButton(props: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: props.selected }}
      style={[styles.optionButton, props.selected && styles.optionButtonSelected]}
      onPress={props.onPress}
    >
      <Text style={[styles.optionText, props.selected && styles.optionTextSelected]}>
        {props.selected ? "✓ " : ""}{props.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { flexGrow: 1, padding: 22, gap: 14 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: "#68717B" },
  title: { fontSize: 34, lineHeight: 40, fontWeight: "900", color: "#1C252E" },
  subtitle: { fontSize: 16, lineHeight: 24, color: "#5D6873" },
  primaryButton: { minHeight: 56, borderRadius: 16, backgroundColor: "#8B1E2D", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  grid: { gap: 12, marginTop: 6 },
  card: { minHeight: 100, borderRadius: 18, padding: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E0D8", justifyContent: "center" },
  cardTitle: { fontSize: 19, fontWeight: "800", color: "#1C252E" },
  cardDescription: { marginTop: 5, fontSize: 14, color: "#68717B" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 34, lineHeight: 36, color: "#1C252E" },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#1C252E" },
  input: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: "#D8D5CB", backgroundColor: "#FFFFFF", paddingHorizontal: 16, fontSize: 16, color: "#1C252E" },
  optionRow: { flexDirection: "row", gap: 10 },
  optionButton: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#CFCBC0", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  optionButtonSelected: { backgroundColor: "#F3E3E6", borderColor: "#8B1E2D" },
  optionText: { fontSize: 15, fontWeight: "700", color: "#5D6873" },
  optionTextSelected: { color: "#8B1E2D" },
  sectionTitle: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#1C252E" },
  listItem: { borderRadius: 15, backgroundColor: "#FFFFFF", padding: 16, borderWidth: 1, borderColor: "#E2E0D8" },
  listItemTitle: { fontSize: 16, fontWeight: "800", color: "#1C252E" },
  listItemDescription: { marginTop: 4, fontSize: 14, color: "#68717B" },
});
