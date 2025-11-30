import React, { useState, useEffect } from 'react';
import { Product, VatType } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';

export default function ProductManagerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm: Product = {
    id: '', barcode: '', name: '', costPrice: 0, sellingPrice: 0, stockQuantity: 0, vatType: VatType.INCLUDED, isActive: true, imageUrl: ''
  };
  const [form, setForm] = useState<Product>(initialForm);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => setProducts(StorageService.getProducts());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave = { ...form, id: editingId || crypto.randomUUID() };
    StorageService.saveProduct(productToSave);
    setIsModalOpen(false);
    loadProducts();
    setForm(initialForm);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setForm(product);
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product?')) {
      StorageService.deleteProduct(id);
      loadProducts();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Product Management</h1>
        <button 
          onClick={() => { setForm(initialForm); setEditingId(null); setIsModalOpen(true); }}
          className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-sky-600"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4 w-16">Img</th>
              <th className="p-4">Barcode</th>
              <th className="p-4">Name</th>
              <th className="p-4 text-right">Cost</th>
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-center">Stock</th>
              <th className="p-4 text-center">VAT</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-4">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-md" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                      <ImageIcon size={16} className="text-slate-400"/>
                    </div>
                  )}
                </td>
                <td className="p-4 font-mono text-sm">{p.barcode}</td>
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-right text-slate-500">฿{p.costPrice}</td>
                <td className="p-4 text-right font-bold">฿{p.sellingPrice}</td>
                <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${p.stockQuantity < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {p.stockQuantity}
                    </span>
                </td>
                <td className="p-4 text-center text-xs text-slate-500">{p.vatType}</td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => handleEdit(p)} className="p-1 text-slate-600 hover:bg-slate-200 rounded"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Barcode</label>
                  <input type="text" required className="w-full border rounded p-2" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Stock</label>
                   <input type="number" required className="w-full border rounded p-2" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                <input type="text" required className="w-full border rounded p-2" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Image URL (Optional)</label>
                <input type="text" className="w-full border rounded p-2" value={form.imageUrl || ''} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Cost Price</label>
                  <input type="number" required className="w-full border rounded p-2" value={form.costPrice} onChange={e => setForm({...form, costPrice: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Selling Price</label>
                  <input type="number" required className="w-full border rounded p-2" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">VAT Type</label>
                  <select className="w-full border rounded p-2" value={form.vatType} onChange={e => setForm({...form, vatType: e.target.value as VatType})}>
                      <option value={VatType.INCLUDED}>Included (7%)</option>
                      <option value={VatType.EXCLUDED}>Excluded (Add 7%)</option>
                      <option value={VatType.NONE}>None</option>
                  </select>
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 mt-4">Save Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}