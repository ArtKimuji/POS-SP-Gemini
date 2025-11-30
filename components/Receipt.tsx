import React from 'react';
import { Transaction, Settings, VatType } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  settings: Settings;
  isFullTaxInvoice?: boolean;
}

export const Receipt: React.FC<ReceiptProps> = ({ transaction, settings, isFullTaxInvoice = false }) => {
  if (!transaction) return null;

  return (
    <div className="bg-white p-4 text-sm font-mono leading-tight max-w-[300px] mx-auto border border-gray-200 print:border-none print:max-w-none print:w-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">{settings.companyName}</h2>
        <p className="text-xs">{settings.address}</p>
        <p className="text-xs">Tax ID: {settings.taxId}</p>
        <p className="text-xs">Tel: {settings.phone}</p>
        <div className="border-b border-black my-2 border-dashed"></div>
        <h3 className="font-bold my-1">
            {transaction.status === 'Voided' ? '(VOIDED) ' : ''}
            {isFullTaxInvoice ? 'FULL TAX INVOICE' : 'RECEIPT / ABB TAX INV'}
        </h3>
      </div>

      {/* Customer Info (Only for Full Tax) */}
      {isFullTaxInvoice && transaction.customerSnapshot && (
        <div className="mb-4 text-xs">
          <p><strong>Customer:</strong> {transaction.customerSnapshot.name}</p>
          <p><strong>Tax ID:</strong> {transaction.customerSnapshot.taxId} ({transaction.customerSnapshot.branch})</p>
          <p><strong>Addr:</strong> {transaction.customerSnapshot.address}</p>
          <div className="border-b border-black my-2 border-dashed"></div>
        </div>
      )}

      {/* Meta */}
      <div className="flex justify-between text-xs mb-2">
        <span>No: {transaction.receiptNo}</span>
        <span>{new Date(transaction.dateTime).toLocaleString('en-GB')}</span>
      </div>

      {/* Items */}
      <div className="mb-2">
        <div className="flex font-bold border-b border-black border-dashed pb-1 mb-1">
          <span className="w-8">Qty</span>
          <span className="flex-1">Item</span>
          <span className="w-16 text-right">Total</span>
        </div>
        {transaction.items.map((item) => (
          <div key={item.id} className="flex mb-1">
            <span className="w-8">{item.quantity}</span>
            <span className="flex-1">{item.productName} <span className="text-[10px] text-gray-500">@{item.pricePerUnit.toFixed(2)}</span></span>
            <span className="w-16 text-right">{item.totalLineItem.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-black border-dashed pt-2 space-y-1">
        <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{(transaction.totalAmount + transaction.discount).toFixed(2)}</span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between text-red-600 print:text-black">
            <span>Discount</span>
            <span>-{transaction.discount.toFixed(2)}</span>
          </div>
        )}
        
        {/* VAT Breakdown */}
        {isFullTaxInvoice ? (
             <>
                <div className="flex justify-between text-xs text-gray-600 print:text-black mt-2">
                    <span>VAT Base (7%)</span>
                    <span>{(transaction.netAmount - transaction.vatAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 print:text-black">
                    <span>VAT Amount</span>
                    <span>{transaction.vatAmount.toFixed(2)}</span>
                </div>
             </>
        ) : (
             <div className="flex justify-between text-[10px]">
                <span>(VAT Included)</span>
                <span>{transaction.vatAmount.toFixed(2)}</span>
            </div>
        )}


        <div className="flex justify-between font-bold text-lg border-t border-black border-dashed pt-2 mt-2">
          <span>TOTAL</span>
          <span>{transaction.netAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment: {transaction.paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-xs">
        <p>{settings.footerMessage}</p>
        <p className="mt-2 text-[10px] text-gray-400">POS System by SwiftPOS</p>
      </div>
    </div>
  );
};