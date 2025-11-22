# 📱 StockSwift - Conversão para React Native com Expo

Guia completo para converter o app web para React Native e gerar o APK.

---

## 🎯 Pré-Requisitos

Instale no seu computador:

1. **Node.js** (versão 18+)
   - Download: https://nodejs.org
   - Verificar: `node --version` e `npm --version`

2. **Git** (opcional, mas recomendado)
   - Download: https://git-scm.com

3. **Android Studio** (para emulador Android)
   - Download: https://developer.android.com/studio
   - OU use um celular físico

---

## ✅ Passo 1: Configurar Ambiente Expo

\`\`\`bash
# Instalar Expo CLI globalmente
npm install -g expo-cli

# Verificar instalação
expo --version

# Fazer login no Expo (cria conta gratuitamente em https://expo.dev)
expo login
\`\`\`

---

## 📦 Passo 2: Criar Novo Projeto Expo

\`\`\`bash
# Criar novo projeto React Native com Expo
npx create-expo-app StockSwift --template

cd StockSwift

# Instalar dependências necessárias
npm install

# Dependências principais
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install expo-sqlite sqlite
npm install react-native-chart-kit chart.js
npm install react-native-barcode-scanner-universal
npm install react-native-share
npm install zustand react-native-toast-notifications
\`\`\`

---

## 🏗️ Passo 3: Estrutura de Pastas

Reorganizar o projeto assim:

\`\`\`
StockSwift/
├── app/
│   ├── _layout.tsx              # Layout principal (navegação)
│   ├── (tabs)/
│   │   ├── dashboard.tsx        # Home
│   │   ├── products.tsx         # CRUD de produtos
│   │   ├── sales.tsx            # PDV
│   │   ├── reports.tsx          # Relatórios
│   │   └── settings.tsx         # Configurações
│   └── app.json                 # Configuração Expo
├── lib/
│   ├── db.ts                    # Database (SQLite)
│   ├── hooks.ts                 # Custom hooks
│   └── store.ts                 # Zustand store (estado global)
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   └── [componentes específicos]
├── constants/
│   └── colors.ts                # Paleta de cores
└── app.json                     # Config do Expo
\`\`\`

---

## 💾 Passo 4: Database Local (SQLite)

Substituir IndexedDB por SQLite (nativo do React Native):

**lib/db.ts**
\`\`\`tsx
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('stockswift.db');

export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      // Tabela de Produtos
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          sku TEXT UNIQUE,
          name TEXT NOT NULL,
          cost REAL NOT NULL,
          salePrice REAL NOT NULL,
          quantity INTEGER NOT NULL,
          expiryDate TEXT,
          createdAt TEXT,
          updatedAt TEXT
        );`
      );

      // Tabela de Vendas
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          date TEXT,
          products TEXT,
          total REAL,
          discount REAL,
          paymentMethod TEXT,
          createdAt TEXT
        );`
      );

      // Tabela de Movimentações
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS movements (
          id TEXT PRIMARY KEY,
          productId TEXT,
          type TEXT,
          quantity INTEGER,
          reason TEXT,
          date TEXT,
          FOREIGN KEY(productId) REFERENCES products(id)
        );`,
        [],
        () => resolve(true),
        (_, err) => reject(err)
      );
    });
  });
};

// Funções CRUD
export const addProduct = async (product: any) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO products (id, sku, name, cost, salePrice, quantity, expiryDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.sku,
          product.name,
          product.cost,
          product.salePrice,
          product.quantity,
          product.expiryDate,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
        (_, result) => resolve(result),
        (_, err) => reject(err)
      );
    });
  });
};

export const getProducts = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM products ORDER BY updatedAt DESC`,
        [],
        (_, result) => resolve(result.rows._array),
        (_, err) => reject(err)
      );
    });
  });
};

export const deleteProduct = async (id: string) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM products WHERE id = ?`,
        [id],
        (_, result) => resolve(result),
        (_, err) => reject(err)
      );
    });
  });
};

export const recordSale = async (sale: any) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO sales (id, date, products, total, discount, paymentMethod, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sale.id,
          new Date().toISOString(),
          JSON.stringify(sale.products),
          sale.total,
          sale.discount,
          sale.paymentMethod || 'cash',
          new Date().toISOString(),
        ],
        (_, result) => resolve(result),
        (_, err) => reject(err)
      );
    });
  });
};

export const getSales = async (startDate?: string, endDate?: string) => {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM sales`;
    const params: any[] = [];

    if (startDate && endDate) {
      query += ` WHERE date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC`;

    db.transaction((tx) => {
      tx.executeSql(
        query,
        params,
        (_, result) => {
          const sales = result.rows._array.map((sale: any) => ({
            ...sale,
            products: JSON.parse(sale.products),
          }));
          resolve(sales);
        },
        (_, err) => reject(err)
      );
    });
  });
};

export const exportBackup = async () => {
  try {
    const products = await getProducts();
    const sales = await getSales();
    return { products, sales, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('Erro ao exportar backup:', err);
    throw err;
  }
};

export const importBackup = async (backup: any) => {
  try {
    // Limpar dados existentes
    await new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql('DELETE FROM sales', []);
        tx.executeSql('DELETE FROM products', [], () => resolve(true), (_, err) => reject(err));
      });
    });

    // Importar novo dados
    for (const product of backup.products) {
      await addProduct(product);
    }

    for (const sale of backup.sales) {
      await recordSale(sale);
    }

    return true;
  } catch (err) {
    console.error('Erro ao importar backup:', err);
    throw err;
  }
};
\`\`\`

---

## 🎨 Passo 5: Configurar App.json

**app.json**
\`\`\`json
{
  "expo": {
    "name": "StockSwift",
    "slug": "stockswift",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.stockswift.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.stockswift.app",
      "permissions": [
        "CAMERA",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera"
        }
      ]
    ]
  }
}
\`\`\`

---

## 🔧 Passo 6: Adaptar Componentes

Cada componente web precisa ser adaptado para React Native. Exemplo:

**Web (React)**
\`\`\`tsx
<button className="bg-green-500">Adicionar</button>
<input type="text" />
\`\`\`

**React Native**
\`\`\`tsx
import { TouchableOpacity, TextInput } from 'react-native';

<TouchableOpacity style={{ backgroundColor: '#10b981' }}>
  <Text>Adicionar</Text>
</TouchableOpacity>

<TextInput 
  style={{ borderWidth: 1, padding: 10 }}
  placeholder="Digite..."
/>
\`\`\`

**Mapeamento de Componentes:**

| Web | React Native |
|-----|--------------|
| `<button>` | `<TouchableOpacity>` ou `<Pressable>` |
| `<input>` | `<TextInput>` |
| `<div>` | `<View>` |
| `<p>`, `<h1>`, etc | `<Text>` |
| `className` (Tailwind) | `style={{}}` ou StyleSheet |
| `onClick` | `onPress` |
| `onChange` | `onChangeText` |
| flex layouts | Mesma lógica de `flexDirection` |

---

## 🧪 Passo 7: Testar Localmente

\`\`\`bash
# Terminal 1: Iniciar servidor Expo
npm start

# Seguir as instruções:
# - Pressionar 'i' para abrir no iOS Simulator
# - Pressionar 'a' para abrir no Android Emulator
# - Escanear QR code com Expo Go no celular físico
\`\`\`

---

## 📲 Passo 8: Preparar para Gerar APK

### Criar Conta EAS (Expo Application Services)

\`\`\`bash
# Login na conta Expo (já feito no Passo 1)
expo login

# Inicializar EAS no projeto
eas build:configure

# Selecionar Android quando perguntado
\`\`\`

---

## 🚀 Passo 9: Gerar APK

\`\`\`bash
# Gerar APK para Android
eas build --platform android --local

# OU gerar na nuvem (recomendado - mais rápido):
eas build --platform android
\`\`\`

**Opções:**
- `--local`: Compila no seu computador (requer Android SDK)
- Sem `--local`: Compila na nuvem do Expo (mais fácil)

---

## ✅ Passo 10: Obter e Instalar APK

\`\`\`bash
# Após a compilação, você receberá um link para download
# OU use:
eas build:list

# Copiar o link do APK e abrir no celular
# OU transferir via USB
\`\`\`

**Instalar no celular:**
1. Download o APK
2. Abrir o arquivo no celular
3. Permitir instalação de "Fontes desconhecidas"
4. Instalar e pronto!

---

## 🔄 Fluxo Completo (Resumido)

\`\`\`bash
# 1. Criar projeto
npx create-expo-app StockSwift
cd StockSwift

# 2. Instalar dependências
npm install @react-navigation/native react-native-screens expo-sqlite zustand

# 3. Copiar/adaptar código
# (substituir componentes web por React Native)

# 4. Testar
npm start
# Escanear QR code com Expo Go

# 5. Preparar para build
eas build:configure

# 6. Gerar APK
eas build --platform android

# 7. Baixar e instalar
# Usar link fornecido
\`\`\`

---

## 📝 Checklist de Adaptação

- [ ] Database SQLite implementada
- [ ] Componentes convertidos para React Native
- [ ] Navegação com React Navigation configurada
- [ ] Ícones e splash screen personalizados
- [ ] Testado no emulador/celular
- [ ] App.json configurado corretamente
- [ ] EAS Build configurado
- [ ] APK gerado e testado

---

## 🚨 Troubleshooting Comum

### Erro: "Command not found: expo"
\`\`\`bash
npm install -g expo-cli
\`\`\`

### Erro: "JAVA_HOME not found"
- Instalar Android Studio
- Configurar variável de ambiente JAVA_HOME

### Erro: "Device not found"
- Iniciar emulador Android Studio antes
- OU conectar celular via USB

### Build falhando na nuvem
\`\`\`bash
# Limpar cache e tentar novamente
eas build:cache:clear
eas build --platform android
\`\`\`

---

## 📚 Recursos Úteis

- Documentação Expo: https://docs.expo.dev
- React Native: https://reactnative.dev
- EAS Build: https://docs.expo.dev/build
- Navigationação: https://reactnavigation.org

---

Qualquer dúvida, siga os passos 1 por 1! 🚀
