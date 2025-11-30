import { Product, Settings, Transaction, TransactionStatus, VatType, TransactionItem, Customer } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'pos_settings',
  PRODUCTS: 'pos_products',
  TRANSACTIONS: 'pos_transactions',
  CUSTOMERS: 'pos_customers',
};

const DEFAULT_SETTINGS: Settings = {
  companyName: 'My Local Shop Co., Ltd.',
  address: '123 Commerce Rd, Bangkok, 10110',
  taxId: '0105555555555',
  phone: '02-123-4567',
  footerMessage: 'Thank you for your business!',
  vatRate: 7,
};

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', barcode: '88500001', name: 'Espresso', costPrice: 40, sellingPrice: 60, stockQuantity: 100, vatType: VatType.INCLUDED, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1510591509098-f40962d438a7?auto=format&fit=crop&w=300&q=80' },
  { id: '2', barcode: '88500002', name: 'Green Tea Latte', costPrice: 45, sellingPrice: 70, stockQuantity: 50, vatType: VatType.INCLUDED, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231847233?auto=format&fit=crop&w=300&q=80' },
  { id: '3', barcode: '88500003', name: 'Croissant', costPrice: 20, sellingPrice: 85, stockQuantity: 20, vatType: VatType.EXCLUDED, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80' },
  { id: '4', barcode: '88500004', name: 'Water', costPrice: 5, sellingPrice: 15, stockQuantity: 200, vatType: VatType.NONE, isActive: true, imageUrl: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=300&q=80' },
];

// Helper to simulate DB delays
const delay = () => new Promise(resolve => setTimeout(resolve, 50));

export const StorageService = {
  // --- Settings ---
  getSettings: (): Settings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: Settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- Products ---
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  },
  saveProduct: (product: Product) => {
    const products = StorageService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  deleteProduct: (id: string) => {
    const products = StorageService.getProducts().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  // Simulate stock deduction
  updateStock: (items: TransactionItem[], reverse: boolean = false) => {
    const products = StorageService.getProducts();
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (reverse) {
          product.stockQuantity += item.quantity;
        } else {
          product.stockQuantity -= item.quantity;
        }
      }
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // --- Customers ---
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomer: (customer: Customer) => {
    const customers = StorageService.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  // --- Transactions ---
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  
  saveTransaction: (transaction: Transaction) => {
    const transactions = StorageService.getTransactions();
    // Logic for generating running number if new
    if (!transactions.find(t => t.id === transaction.id)) {
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const count = transactions.filter(t => t.dateTime.startsWith(new Date().toISOString().slice(0,10))).length + 1;
      transaction.receiptNo = `INV-${dateStr}-${String(count).padStart(4, '0')}`;
      
      // Deduct Stock
      StorageService.updateStock(transaction.items, false);
    }
    transactions.unshift(transaction); // Add to top
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transaction;
  },

  voidTransaction: (id: string) => {
    const transactions = StorageService.getTransactions();
    const txIndex = transactions.findIndex(t => t.id === id);
    if (txIndex >= 0 && transactions[txIndex].status !== TransactionStatus.VOIDED) {
      transactions[txIndex].status = TransactionStatus.VOIDED;
      // Return Stock
      StorageService.updateStock(transactions[txIndex].items, true);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  },

  updateTransactionCustomer: (id: string, customer: Customer) => {
     const transactions = StorageService.getTransactions();
     const txIndex = transactions.findIndex(t => t.id === id);
     if (txIndex >= 0) {
       transactions[txIndex].customerId = customer.id;
       transactions[txIndex].customerSnapshot = customer;
       localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
     }
  }
};