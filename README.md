# Pedido de Carnes

Aplicativo offline-first para Android e iOS que agiliza pedidos de carnes enviados a vários fornecedores pelo WhatsApp.

## 👀 Veja como o aplicativo está ficando

![Protótipo completo do aplicativo](docs/prototype/fluxo-completo.svg)

Para abrir a visualização em uma página separada, toque em **[PROTOTYPE.md](PROTOTYPE.md)**.

## Escopo do MVP

- Vários fornecedores
- Produtos por fornecedor
- Quantidades em caixas e unidades
- Identificação do responsável
- Funcionamento offline com SQLite
- Mensagem revisável antes de abrir o WhatsApp
- Administração protegida por PIN

## Arquitetura

A base separa domínio, infraestrutura e apresentação. As regras de criação do pedido não dependem de componentes React Native, facilitando testes, manutenção e futura sincronização em nuvem.

```text
src/
├── domain/          # Entidades e regras de negócio
├── infrastructure/  # SQLite, repositórios e integrações
└── presentation/    # Telas, componentes e navegação
```

## Executar

```bash
npm install
npx expo start
```

Use o aplicativo Expo Go para testes iniciais. A abertura e o envio real pelo WhatsApp exigem conexão, mas a montagem e o armazenamento do pedido funcionam offline.

## Segurança

- Não armazenar senha ou sessão do WhatsApp
- Validar telefone e quantidades
- Proteger cadastros administrativos com PIN armazenado de forma segura
- Nunca incluir chaves de API no repositório

## Testes prioritários

- Pedido com caixas e unidades
- Pedido vazio
- Quantidade zero ou negativa
- Fornecedor sem telefone válido
- Persistência após reiniciar o aplicativo
- Funcionamento em modo avião
- Compatibilidade Android e iOS

## Próximas entregas

1. Validar o protótipo visual
2. Associar produtos aos fornecedores
3. Finalizar cadastros administrativos
4. Testar o fluxo completo no Android
5. Gerar APK de teste
6. Preparar build para iOS
