import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, CartItem, Settings, Transaction, PaymentMethod, TransactionStatus, VatType, TransactionItem } from '../types';
import { StorageService } from '../services/storage';
import { Receipt } from '../components/Receipt';
import { Search, Trash2, Plus, Minus, CreditCard, RotateCcw, Box, CheckCircle } from 'lucide-react';

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'METHOD' | 'CASH_INPUT'>('METHOD');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  
  const [discount, setDiscount] = useState(0);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  
  // Animation State
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setProducts(StorageService.getProducts());
    setSettings(StorageService.getSettings());
  }, []);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
        alert("Out of stock!");
        return;
    }
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= existing.stockQuantity) return prev; 
        return prev.map(p => p.id === product.id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.cartQuantity + delta);
        if (newQty > item.stockQuantity) return item; 
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  };

  const clearCart = () => {
      setCart([]);
      setDiscount(0);
  }

  const applyQuickDiscount = (percentage: number) => {
      const amount = Math.floor(subtotal * (percentage / 100));
      setDiscount(amount);
  }

  const filteredProducts = useMemo(() => {
    const s = search.toLowerCase();
    return products.filter(p => 
      p.isActive && 
      (p.name.toLowerCase().includes(s) || p.barcode.includes(s))
    );
  }, [products, search]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.cartQuantity), 0);
  const total = Math.max(0, subtotal - discount);
  const changeDue = (typeof cashReceived === 'number') ? Math.max(0, cashReceived - total) : 0;
  
  // Backwards calculate VAT for display purposes
  const calculateVat = () => {
      let vatTotal = 0;
      cart.forEach(item => {
          const lineTotal = item.sellingPrice * item.cartQuantity;
          const ratio = subtotal > 0 ? lineTotal / subtotal : 0;
          const lineDiscount = discount * ratio;
          const actualLineTotal = lineTotal - lineDiscount;

          if (item.vatType === VatType.INCLUDED) {
            vatTotal += actualLineTotal * (settings.vatRate / (100 + settings.vatRate));
          } else if (item.vatType === VatType.EXCLUDED) {
            vatTotal += actualLineTotal * (settings.vatRate / 100);
          }
      });
      return vatTotal;
  };

  const openPaymentModal = () => {
      setPaymentStep('METHOD');
      setCashReceived('');
      setShowPaymentModal(true);
  };

  const handleCheckout = (method: PaymentMethod) => {
    const vatAmount = calculateVat();
    
    // Map cart to transaction items
    const txItems: TransactionItem[] = cart.map(c => ({
        id: crypto.randomUUID(),
        transactionId: '',
        productId: c.id,
        productName: c.name,
        quantity: c.cartQuantity,
        pricePerUnit: c.sellingPrice,
        totalLineItem: c.sellingPrice * c.cartQuantity
    }));

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      receiptNo: '', // filled by service
      dateTime: new Date().toISOString(),
      customerId: null,
      totalAmount: subtotal,
      discount: discount,
      vatAmount: vatAmount,
      netAmount: total + (cart.some(c => c.vatType === VatType.EXCLUDED) ? vatAmount : 0), 
      paymentMethod: method,
      status: TransactionStatus.COMPLETED,
      note: '',
      items: txItems
    };

    let finalNet = 0;
    cart.forEach(item => {
         const lineTotal = item.sellingPrice * item.cartQuantity;
         finalNet += lineTotal;
         if (item.vatType === VatType.EXCLUDED) {
             finalNet += lineTotal * (settings.vatRate / 100);
         }
    });
    finalNet -= discount;
    newTx.netAmount = finalNet;

    const savedTx = StorageService.saveTransaction(newTx);
    setLastTransaction(savedTx);
    
    // Refresh stock
    setProducts(StorageService.getProducts());
    setShowPaymentModal(false);
    
    // Show Success Animation
    setIsSuccess(true);
    
    setTimeout(() => {
        setIsSuccess(false);
        clearCart();
        window.print();
    }, 1500); // 1.5s delay before printing/clearing
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4 relative">
      
      {/* Success Overlay */}
      {isSuccess && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-xl">
              <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Payment Successful!</h2>
                  <p className="text-slate-500 mt-2">Printing receipt...</p>
              </div>
          </div>
      )}

      {/* Left Column: Products */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Scan barcode or search name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stockQuantity <= 0}
              className={`flex flex-col items-stretch justify-between rounded-lg border transition-all overflow-hidden ${product.stockQuantity > 0 ? 'hover:shadow-md border-slate-200 bg-white' : 'opacity-60 bg-slate-50 cursor-not-allowed'}`}
            >
              {/* Product Image Section */}
              <div className="h-32 w-full bg-slate-100 flex items-center justify-center relative">
                  {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                      <Box className="text-slate-300 w-12 h-12"/>
                  )}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {product.stockQuantity}
                  </div>
              </div>
              
              <div className="p-3 text-left">
                <h3 className="font-semibold text-slate-800 text-sm line-clamp-1" title={product.name}>{product.name}</h3>
                <p className="text-accent font-bold mt-1">฿{product.sellingPrice.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-lg border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h2 className="font-bold text-slate-700">Current Bill</h2>
          <button onClick={clearCart} className="text-xs text-red-500 hover:underline flex items-center gap-1">
            <RotateCcw size={12}/> Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-500">฿{item.sellingPrice} x {item.cartQuantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Minus size={14}/></button>
                  <span className="w-6 text-center text-sm font-bold">{item.cartQuantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Plus size={14}/></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-400 hover:bg-red-50 rounded ml-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          
          {/* Quick Discount Buttons */}
          <div className="flex gap-2 mb-2">
              <button onClick={() => applyQuickDiscount(5)} className="flex-1 py-1 text-xs border rounded bg-white hover:bg-slate-100 text-slate-600">5%</button>
              <button onClick={() => applyQuickDiscount(10)} className="flex-1 py-1 text-xs border rounded bg-white hover:bg-slate-100 text-slate-600">10%</button>
              <button onClick={() => applyQuickDiscount(20)} className="flex-1 py-1 text-xs border rounded bg-white hover:bg-slate-100 text-slate-600">20%</button>
              <button onClick={() => setDiscount(0)} className="flex-1 py-1 text-xs border rounded bg-white hover:bg-red-50 text-red-500">None</button>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span>฿{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-500">Discount (THB)</span>
            <input 
              type="number" 
              value={discount} 
              onChange={e => setDiscount(Number(e.target.value))}
              className="w-20 text-right p-1 border rounded text-xs focus:ring-2 focus:ring-accent outline-none"
              min="0"
            />
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
            <span>Total</span>
            <span>฿{total.toFixed(2)}</span>
          </div>
          
          <button 
            disabled={cart.length === 0}
            onClick={openPaymentModal}
            className="w-full mt-4 bg-accent hover:bg-sky-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-sky-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <CreditCard size={18} /> Checkout
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px]">
            <h3 className="text-xl font-bold mb-4">
                {paymentStep === 'METHOD' ? 'Select Payment Method' : 'Cash Payment'}
            </h3>
            
            {paymentStep === 'METHOD' ? (
                // Step 1: Select Method
                <div className="space-y-3">
                    <button 
                        onClick={() => setPaymentStep('CASH_INPUT')}
                        className="w-full p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 flex items-center gap-3 transition-colors"
                    >
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">฿</div>
                        <div className="text-left">
                            <div className="font-bold">Cash</div>
                            <div className="text-xs text-gray-500">Receive cash & calculate change</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => handleCheckout(PaymentMethod.QR)}
                        className="w-full p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 flex items-center gap-3 transition-colors"
                    >
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">QR</div>
                        <div className="text-left">
                            <div className="font-bold">Scan QR</div>
                            <div className="text-xs text-gray-500">PromptPay / Bank Transfer</div>
                        </div>
                    </button>
                    <button onClick={() => setShowPaymentModal(false)} className="w-full mt-4 py-2 text-slate-500 hover:text-slate-800">Cancel</button>
                </div>
            ) : (
                // Step 2: Cash Input
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <span className="text-slate-500 text-sm">Total Amount</span>
                        <div className="text-3xl font-bold text-slate-800">฿{total.toFixed(2)}</div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1">Cash Received</label>
                        <input 
                            type="number" 
                            autoFocus
                            className="w-full text-xl p-2 border rounded-lg text-right focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="0.00"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => setCashReceived(total)} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">Exact</button>
                        <button onClick={() => setCashReceived(100)} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">100</button>
                        <button onClick={() => setCashReceived(500)} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">500</button>
                        <button onClick={() => setCashReceived(1000)} className="px-2 py-1 text-xs border rounded hover:bg-slate-100">1000</button>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t border-dashed">
                        <span className="font-bold text-slate-600">Change Due:</span>
                        <span className={`text-xl font-bold ${changeDue < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            ฿{changeDue.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button onClick={() => setPaymentStep('METHOD')} className="flex-1 py-3 text-slate-500 border rounded-lg hover:bg-slate-50">Back</button>
                        <button 
                            disabled={typeof cashReceived !== 'number' || cashReceived < total}
                            onClick={() => handleCheckout(PaymentMethod.CASH)}
                            className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Print Area */}
      {lastTransaction && (
          <div className="print-only">
              <Receipt transaction={lastTransaction} settings={settings} />
          </div>
      )}
    </div>
  );
}