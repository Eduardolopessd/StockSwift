# StockSwift - Documentação Completa

## Visão Geral

**StockSwift** é um aplicativo web responsivo de controle de estoque local, projetado para pequenos e médios negócios gerenciarem produtos, realizar vendas e analisar lucratividade com **100% offline** (sem conexão com internet).

---

## Arquitetura Geral

### Camadas de Aplicação

\`\`\`
┌─────────────────────────────────────────┐
│         Interface (React Components)     │
│  - Dashboard, PDV, Relatórios, Config   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         State Management (Hooks)         │
│  - useProducts(), useSales()             │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Database Layer (lib/db.ts)          │
│  - IndexedDB (armazenamento local)       │
└─────────────────────────────────────────┘
\`\`\`

---

## 1. BANCO DE DADOS (lib/db.ts)

### O que é?
A camada **db.ts** gerencia TODA a persistência de dados usando **IndexedDB** (banco de dados nativo do navegador).

### Tipos de Dados Principais

#### 1.1 Product (Produto)
\`\`\`typescript
{
  id: "prod_1700000000000_abc123",      // ID único gerado automaticamente
  sku: "SKU001",                        // Código do fabricante
  internalCode: "INT001",               // Código interno gerado
  name: "Açúcar 1kg",                   // Nome do produto
  quantity: 100,                        // Quantidade em estoque
  costPrice: 2.50,                      // Preço de custo (compra)
  salePrice: 3.50,                      // Preço de venda
  expiryDate: "2024-12-31",             // Data de validade
  description: "Açúcar cristal branco", // Descrição opcional
  image: "...",                         // Imagem opcional
  createdAt: 1700000000000,             // Timestamp de criação
  updatedAt: 1700000000000              // Timestamp de última edição
}
\`\`\`

#### 1.2 Sale (Venda)
\`\`\`typescript
{
  id: "sale_1700000000000_xyz789",      // ID único
  items: [                              // Itens vendidos
    {
      productId: "prod_123",
      quantity: 5,
      salePrice: 3.50,
      costPrice: 2.50
    }
  ],
  subtotal: 17.50,                      // Soma sem desconto
  discount: 2.50,                       // Valor do desconto
  discountType: "fixed",                // "fixed" (R$) ou "percentage" (%)
  total: 15.00,                         // Valor final
  costOfGoodsSold: 12.50,               // Custo dos produtos vendidos
  createdAt: 1700000000000
}
\`\`\`

### Métodos da Database

| Método | Descrição | Retorna |
|--------|-----------|---------|
| `init()` | Inicializa IndexedDB | void |
| `addProduct(product)` | Adiciona novo produto | Product |
| `getProduct(id)` | Busca produto por ID | Product \| undefined |
| `getAllProducts()` | Lista todos os produtos | Product[] |
| `searchProducts(query)` | Busca por nome/SKU/código | Product[] |
| `updateProduct(id, updates)` | Atualiza produto | Product |
| `deleteProduct(id)` | Remove produto | void |
| `addSale(sale)` | Registra venda + atualiza estoque | Sale |
| `getAllSales()` | Lista todas as vendas | Sale[] |
| `getSalesByMonth(year, month)` | Vendas de um mês específico | Sale[] |
| `exportData()` | Exporta tudo em JSON | BackupData |
| `importData(data)` | Restaura dados do backup | void |
| `clearAllData()` | Apaga todos os dados | void |

### Como Funciona IndexedDB?

1. Dados são armazenados **localmente no navegador**
2. Sem depender de servidor
3. Persiste mesmo fechando o navegador
4. Limite ~50MB por site (suficiente para ~100k produtos)
5. Totalmente offline

---

## 2. HOOKS (lib/hooks.ts)

### O que são?
Custom React hooks que encapsulam toda a lógica de acesso ao banco de dados.

### useProducts()

**Retorna:**
\`\`\`typescript
{
  products: Product[],                  // Lista de produtos
  loading: boolean,                     // Carregando dados?
  addProduct(product): Promise<Product>,
  updateProduct(id, updates): Promise<Product>,
  deleteProduct(id): Promise<void>,
  searchProducts(query): Promise<Product[]>
}
\`\`\`

**Exemplo de uso:**
\`\`\`tsx
const { products, loading, addProduct } = useProducts()

const handleAdd = async () => {
  const newProduct = await addProduct({
    sku: "SKU001",
    internalCode: "INT001",
    name: "Produto",
    quantity: 10,
    costPrice: 5,
    salePrice: 10,
    expiryDate: "2024-12-31"
  })
}
\`\`\`

### useSales()

**Retorna:**
\`\`\`typescript
{
  sales: Sale[],
  addSale(sale): Promise<Sale>,
  getSalesByMonth(year, month): Promise<Sale[]>
}
\`\`\`

---

## 3. COMPONENTES PRINCIPAIS

### 3.1 Dashboard (components/dashboard.tsx)

**O que faz:**
- Exibe KPIs do negócio
- Mostra quantidade de produtos
- Calcula valor total do estoque
- Alerta produtos vencendo

**Dados exibidos:**
\`\`\`
┌────────────────────┬────────────────────┐
│ Produtos: 150      │ Valor Total: R$... │
├────────────────────┴────────────────────┤
│ ⚠️ PRODUTOS VENCENDO EM 30 DIAS         │
│ - Arroz 5kg (Vence: 20/12/2024)         │
│ - Feijão 1kg (Vence: 15/01/2025)        │
├──────────────────────────────────────────┤
│ [Iniciar Venda]                          │
└──────────────────────────────────────────┘
\`\`\`

### 3.2 Buscar Produto (components/product-search.tsx)

**O que faz:**
- Busca por SKU, nome ou código interno
- Exibe detalhes do produto
- Permite editar quantidade/preços
- Avisa quantidade disponível

### 3.3 Adicionar Produto (components/add-product.tsx)

**O que faz:**
- Formulário para novo produto
- Valida SKU único
- Gera código interno automaticamente
- Salva no banco de dados

**Campos:**
- SKU (código do fornecedor)
- Nome do produto
- Quantidade inicial
- Preço de custo
- Preço de venda
- Data de validade
- Descrição (opcional)

### 3.4 Remover Produto (components/remove-product.tsx)

**O que faz:**
- Lista todos os produtos
- Permite remover com confirmação
- Atualiza estoque em tempo real

### 3.5 Tela de Vendas/PDV (components/sales-screen.tsx)

**Fluxo:**
\`\`\`
1. Buscar produto (por nome/SKU/código)
2. Clicar para adicionar ao carrinho
3. Ajustar quantidade (buttons +/-)
4. Definir desconto (R$ ou %)
5. Opção: vender a preço de custo
6. Finalizar venda
\`\`\`

**O que acontece:**
- Busca em tempo real
- Valida quantidade disponível
- Calcula total automaticamente
- Atualiza estoque automaticamente
- Registra no histórico de vendas

### 3.6 Relatórios (components/report-screen.tsx)

**Análises:**
- Lucro vs Custo por mês
- Receita Bruta
- Descontos aplicados
- Receita Líquida
- Custo dos Produtos Vendidos (CMV)
- Lucro Líquido
- Volume de unidades vendidas
- Exportação em CSV/JSON

### 3.7 Configurações (components/settings-screen.tsx)

**Funcionalidades:**
- Tema claro/escuro
- Backup completo em JSON
- Restaurar dados do backup
- Limpar tudo (com confirmação)
- Informações do app

---

## 4. FLUXOS PRINCIPAIS

### Fluxo: Adicionar Produto

\`\`\`
[Clique em "Adicionar Produto"]
           ↓
    [Formulário exibe]
           ↓
    [Preencher dados]
           ↓
    [Gera ID + código interno]
           ↓
    [Salva no IndexedDB]
           ↓
    [Atualiza lista em tempo real]
           ↓
    [Volta para busca/estoque]
\`\`\`

### Fluxo: Realizar Venda

\`\`\`
[Clique em "Iniciar Venda"]
           ↓
    [PDV abre com busca]
           ↓
    [Busca produto → clica para adicionar]
           ↓
    [Produto entra no carrinho]
           ↓
    [Ajusta quantidade]
           ↓
    [Define desconto (opcional)]
           ↓
    [Clica "Finalizar Venda"]
           ↓
    [Salva venda no banco]
           ↓
    [Reduz estoque automaticamente]
           ↓
    [Limpa carrinho]
           ↓
    [Volta ao dashboard]
\`\`\`

### Fluxo: Analisar Relatório

\`\`\`
[Clique em "Relatório"]
           ↓
    [Seleciona mês/ano]
           ↓
    [Busca todas as vendas do mês]
           ↓
    [Calcula métricas]
           ↓
    [Exibe gráficos]
           ↓
    [Exporta em CSV/JSON (opcional)]
\`\`\`

---

## 5. TECNOLOGIAS USADAS

| Tecnologia | Para quê | Por quê |
|-----------|----------|--------|
| **React** | Interface | Componentes reutilizáveis |
| **Next.js** | Framework web | Deploy rápido, server actions |
| **TypeScript** | Tipagem | Evita erros |
| **Tailwind CSS** | Estilos | Design responsivo |
| **IndexedDB** | Banco local | Offline first |
| **Recharts** | Gráficos | Visualizações de dados |
| **Lucide Icons** | Ícones | Interface limpa |
| **Zustand** | Estado (optional) | Gerenciar estado global |

---

## 6. FLUXO DE DADOS

\`\`\`
Componente (React)
    ↓
useProducts/useSales (Hooks)
    ↓
db.ts (Database Layer)
    ↓
IndexedDB (Armazenamento Local)
\`\`\`

**Exemplo completo:**
\`\`\`tsx
// 1. Componente chama hook
const { addProduct } = useProducts()

// 2. Hook chama database
export function useProducts() {
  const addProduct = async (product) => {
    // 3. Database salva no IndexedDB
    return await db.addProduct(product)
  }
}

// 4. IndexedDB persiste dados localmente
\`\`\`

---

## 7. CARACTERÍSTICAS PRINCIPAIS

### Offline First ✓
- Funciona 100% sem internet
- Dados salvos localmente
- Sincronização quando volta online (opcional)

### Rápido ✓
- Busca instantânea
- Sem lag
- Otimizado para mobile

### Seguro ✓
- Dados ficam no seu dispositivo
- Nenhum servidor externo
- Backup manual em JSON

### Intuitivo ✓
- Interface limpa
- Fluxo de PDV familiar
- Relatórios visuais

### Responsivo ✓
- Funciona em Desktop
- Funciona em Tablet
- Funciona em Mobile

---

## 8. COMO CONVERTER PARA REACT NATIVE

O código está organizado para facilitar a migração:

1. **lib/db.ts** → Mude para SQLite (expo-sqlite)
2. **Componentes** → Use react-native components
3. **Hooks** → Mantém igual
4. **Estilos Tailwind** → Use react-native styling

Veja **REACT_NATIVE_SETUP.md** para passo a passo.

---

## 9. TROUBLESHOOTING

### Problema: IndexedDB não inicializa
**Solução:** Limpe dados do navegador (Settings → Privacy)

### Problema: Produtos não aparecem
**Solução:** Recarregue a página (F5)

### Problema: Venda não finaliza
**Solução:** Verifique console (F12) para erros

### Problema: Estoque negativo
**Solução:** Não deve acontecer - validação está ativa

---

## 10. PRÓXIMOS PASSOS

- Adicionar scanner de código de barras (camera)
- Integrar com impressora para recibos
- Sincronização em nuvem (Google Drive, Dropbox)
- Multi-usuário e permissões
- Integração com fornecedores

---

**Versão:** 1.0.0
**Última atualização:** Novembro 2024
**Status:** Production Ready
