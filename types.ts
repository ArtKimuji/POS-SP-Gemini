export enum VatType {
  INCLUDED = 'Included',
  EXCLUDED = 'Excluded',
  NONE = 'None'
}

export enum PaymentMethod {
  CASH = 'Cash',
  QR = 'QR Transfer'
}

export enum TransactionStatus {
  COMPLETED = 'Completed',
  VOIDED = 'Voided'
}

export interface Settings {
  companyName: string;
  address: string;
  taxId: string;
  phone: string;
  footerMessage: string;
  vatRate: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  vatType: VatType;
  isActive: boolean;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  taxId: string;
  branch: string; // e.g., "Head Office" or "00001"
  address: string;
  phone: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalLineItem: number;
}

export interface Transaction {
  id: string;
  receiptNo: string;
  dateTime: string;
  customerId: string | null;
  customerSnapshot?: Customer; // For historical accuracy if customer db changes
  totalAmount: number;
  discount: number;
  vatAmount: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  note: string;
  items: TransactionItem[];
}

export interface CartItem extends Product {
  cartQuantity: number;
}