import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>PEDIDOS DO AÇOUGUE</Text>
        <Text style={styles.title}>Pedido de Carnes</Text>
        <Text style={styles.subtitle}>
          Monte pedidos por fornecedor, caixas e unidades, mesmo sem internet.
        </Text>
        <TouchableOpacity accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Novo pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F2" },
  content: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  eyebrow: { fontSize: 13, fontWeight: "700", letterSpacing: 1.4, color: "#59636E" },
  title: { fontSize: 36, lineHeight: 42, fontWeight: "800", color: "#17202A" },
  subtitle: { fontSize: 17, lineHeight: 25, color: "#59636E" },
  primaryButton: { marginTop: 16, minHeight: 56, borderRadius: 16, backgroundColor: "#8B1E2D", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" }
});
