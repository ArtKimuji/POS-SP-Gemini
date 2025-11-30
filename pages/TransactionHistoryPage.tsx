import React, { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, Settings, Customer } from '../types';
import { StorageService } from '../services/storage';
import { Receipt } from '../components/Receipt';
import { Printer, XCircle, FileText, Search } from 'lucide-react';

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showFullTaxModal, setShowFullTaxModal] = useState(false);
  
  // Full Tax Form State
  const [customerForm, setCustomerForm] = useState<Customer>({
      id: '', name: '', taxId: '', branch: 'Head Office', address: '', phone: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
      setTransactions(StorageService.getTransactions());
      setSettings(StorageService.getSettings());
  };

  const handleVoid = (id: string) => {
    if (confirm('Are you sure you want to VOID this transaction? Stock will be returned.')) {
      StorageService.voidTransaction(id);
      loadData();
    }
  };

  const openFullTaxModal = (tx: Transaction) => {
      setSelectedTx(tx);
      // Pre-fill if exists, else blank
      if (tx.customerSnapshot) {
          setCustomerForm(tx.customerSnapshot);
      } else {
          setCustomerForm({ id: crypto.randomUUID(), name: '', taxId: '', branch: 'Head Office', address: '', phone: '' });
      }
      setShowFullTaxModal(true);
  };

  const saveFullTax = () => {
      if (!selectedTx) return;
      StorageService.updateTransactionCustomer(selectedTx.id, customerForm);
      loadData();
      
      // Update the local selectedTx to reflect changes for the print preview
      setSelectedTx({ ...selectedTx, customerId: customerForm.id, customerSnapshot: customerForm });
      
      // We don't close modal immediately, user might want to print
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Transaction History</h1>
      
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4">Receipt No</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4">Payment</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-sm">{tx.receiptNo}</td>
                <td className="p-4 text-sm text-slate-600">{new Date(tx.dateTime).toLocaleString()}</td>
                <td className="p-4 text-right font-bold text-slate-800">฿{tx.netAmount.toFixed(2)}</td>
                <td className="p-4 text-sm text-slate-600">{tx.paymentMethod}</td>
                <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === TransactionStatus.COMPLETED ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.status}
                    </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                        onClick={() => openFullTaxModal(tx)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded" 
                        title="Full Tax Invoice"
                    >
                        <FileText size={16} />
                    </button>
                    {tx.status === TransactionStatus.COMPLETED && (
                        <button 
                            onClick={() => handleVoid(tx.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded" 
                            title="Void Transaction"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-400">No transactions found.</div>
        )}
      </div>

      {/* Full Tax / Print Modal */}
      {showFullTaxModal && selectedTx && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            
            {/* Form Side */}
            <div className="w-full md:w-1/2 p-6 border-r border-slate-200 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Issue Full Tax Invoice</h3>
                    <button onClick={() => setShowFullTaxModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Customer Name / Company</label>
                        <input 
                            className="w-full border rounded p-2 text-sm" 
                            value={customerForm.name} 
                            onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tax ID</label>
                            <input 
                                className="w-full border rounded p-2 text-sm" 
                                value={customerForm.taxId} 
                                onChange={e => setCustomerForm({...customerForm, taxId: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Branch</label>
                            <input 
                                className="w-full border rounded p-2 text-sm" 
                                value={customerForm.branch} 
                                onChange={e => setCustomerForm({...customerForm, branch: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                        <textarea 
                            className="w-full border rounded p-2 text-sm" 
                            rows={3}
                            value={customerForm.address} 
                            onChange={e => setCustomerForm({...customerForm, address: e.target.value})}
                        />
                    </div>
                    
                    <button 
                        onClick={saveFullTax}
                        className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700 transition"
                    >
                        Save Customer Info
                    </button>
                    
                    <div className="pt-4 border-t mt-4">
                         <button 
                            onClick={handlePrint}
                            className="w-full bg-accent text-white py-3 rounded-lg font-bold shadow-lg hover:bg-sky-600 flex items-center justify-center gap-2"
                        >
                            <Printer size={20} /> Print Invoice
                        </button>
                        <p className="text-xs text-center text-slate-400 mt-2">Use Ctrl+P or this button to print the preview on the right.</p>
                    </div>
                </div>
            </div>

            {/* Preview Side */}
            <div className="w-full md:w-1/2 bg-slate-100 p-8 flex justify-center overflow-y-auto">
                 <div className="shadow-xl">
                    <Receipt transaction={selectedTx} settings={settings} isFullTaxInvoice={true} />
                 </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden container for global printing if needed, though the modal serves as preview */}
      {showFullTaxModal && selectedTx && (
         <div className="print-only">
             <Receipt transaction={selectedTx} settings={settings} isFullTaxInvoice={true} />
         </div>
      )}
    </div>
  );
}