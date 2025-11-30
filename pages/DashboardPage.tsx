
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionStatus } from '../types';
import { StorageService } from '../services/storage';
import { Download, Calendar, TrendingUp, ShoppingBag, CreditCard, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
  }, []);

  // Filter transactions based on date range
  const filteredData = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.dateTime);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const active = filteredData.filter(t => t.status === TransactionStatus.COMPLETED);
    const voided = filteredData.filter(t => t.status === TransactionStatus.VOIDED);

    const totalSales = active.reduce((sum, t) => sum + t.netAmount, 0);
    const count = active.length;
    const avgValue = count > 0 ? totalSales / count : 0;
    const voidCount = voided.length;

    return { totalSales, count, avgValue, voidCount };
  }, [filteredData]);

  // Group data by day for the chart
  const dailyData = useMemo(() => {
      const groups: Record<string, number> = {};
      
      filteredData.forEach(t => {
          if (t.status === TransactionStatus.COMPLETED) {
              // Format: DD/MM (Locale dependent, but consistently used for keys)
              const dateObj = new Date(t.dateTime);
              const dateKey = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
              groups[dateKey] = (groups[dateKey] || 0) + t.netAmount;
          }
      });

      // Convert to array and sort by date
      return Object.entries(groups).sort((a,b) => {
           // Parse "DD/MM/YYYY" to Date object for comparison
           const [d1, m1, y1] = a[0].split('/').map(Number);
           const [d2, m2, y2] = b[0].split('/').map(Number);
           return new Date(y1, m1-1, d1).getTime() - new Date(y2, m2-1, d2).getTime();
      });
  }, [filteredData]);

  const handleExport = () => {
    // CSV Header
    const headers = ['Receipt No', 'Date', 'Time', 'Customer', 'Items', 'Total', 'Discount', 'VAT', 'Net Amount', 'Payment', 'Status'];
    
    // CSV Rows
    const rows = filteredData.map(t => {
        const itemSummary = t.items.map(i => `${i.productName} (x${i.quantity})`).join('; ');
        return [
            `"${t.receiptNo}"`,
            new Date(t.dateTime).toLocaleDateString(),
            new Date(t.dateTime).toLocaleTimeString(),
            `"${t.customerSnapshot?.name || '-'}"`,
            `"${itemSummary}"`,
            t.totalAmount.toFixed(2),
            t.discount.toFixed(2),
            t.vatAmount.toFixed(2),
            t.netAmount.toFixed(2),
            t.paymentMethod,
            t.status
        ];
    });

    // Join with commas and newlines, adding BOM for Excel UTF-8 support
    const csvContent = "data:text/csv;charset=utf-8,%EF%BB%BF" 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500">Business overview & performance metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-2">
                <Calendar size={16} className="text-slate-400"/>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="text-sm outline-none bg-transparent text-slate-600 font-medium"
                />
                <span className="text-slate-300">to</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="text-sm outline-none bg-transparent text-slate-600 font-medium"
                />
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Total Revenue" 
            value={`฿${stats.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
            icon={TrendingUp} 
            color="bg-blue-500" 
            subtext="Net sales after discount"
        />
        <StatCard 
            title="Total Orders" 
            value={stats.count} 
            icon={ShoppingBag} 
            color="bg-orange-500" 
            subtext="Completed transactions"
        />
        <StatCard 
            title="Avg. Ticket Size" 
            value={`฿${stats.avgValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
            icon={CreditCard} 
            color="bg-purple-500" 
            subtext="Revenue / Orders"
        />
        <StatCard 
            title="Voided / Cancelled" 
            value={stats.voidCount} 
            icon={AlertCircle} 
            color="bg-red-500" 
            subtext="Returned to stock"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-slate-400"/>
                Daily Sales Trends
            </h3>
            
            <div className="h-64 flex items-end justify-start gap-3 overflow-x-auto pb-2 px-2">
                {dailyData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Calendar size={32} className="mb-2 opacity-50"/>
                        <p>No sales data for this period.</p>
                    </div>
                ) : (
                    dailyData.map(([date, val]) => {
                        const maxVal = Math.max(...dailyData.map(d => d[1]));
                        // Calculate height percentage, ensure at least 5% for visibility
                        const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        const displayHeight = Math.max(height, 5);
                        
                        return (
                            <div key={date} className="flex flex-col items-center gap-2 group min-w-[50px] flex-1">
                                <div className="relative w-full flex justify-center h-full items-end">
                                    <div 
                                        className="w-full max-w-[40px] bg-accent/80 rounded-t-md hover:bg-accent transition-all duration-300 relative group-hover:shadow-lg shadow-sky-200"
                                        style={{ height: `${displayHeight}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none mb-1">
                                            ฿{val.toLocaleString()}
                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{date.split('/').slice(0,2).join('/')}</span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>

        {/* Mini Breakdown or Info */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200 flex flex-col justify-center">
             <h3 className="font-bold text-slate-700 mb-4">Quick Actions</h3>
             <div className="space-y-3">
                 <button onClick={handleExport} className="w-full p-3 border border-slate-200 rounded-lg flex items-center gap-3 hover:bg-slate-50 transition text-slate-600 text-sm">
                     <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Download size={14}/></div>
                     Download Full Report
                 </button>
                 <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed">
                     <strong className="text-slate-700 block mb-1">Tip:</strong>
                     Exporting data allows you to perform deeper analysis in Excel or Google Sheets. The CSV file is formatted to support Thai characters automatically.
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4 transition hover:shadow-md">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg shrink-0`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
            {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);
