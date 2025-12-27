
import React, { useState, useEffect } from 'react';
import { 
  Users, LayoutDashboard, Search, PlusCircle, AlertCircle, LogOut, 
  Calendar as CalendarIcon, DollarSign, Trash2, 
  RefreshCcw, CheckCircle, Printer, Clock, Plus, UserPlus, UserMinus, ChevronLeft, Share2, Info, Sparkles, Send,
  Wifi, Router, Signal, Globe, List, FileText, X, Cable, TowerControl as Tower
} from 'lucide-react';
import { Subscriber, ViewState, DebtMonth } from './types';

const APP_PASSWORD = "gh1998"; 
const STORAGE_KEY = "almomin_net_pro_v1";

const PRESET_AMOUNTS = [25000, 30000, 35000, 40000, 45000, 50000, 55000];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('login');
  const [password, setPassword] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [renewalSearchQuery, setRenewalSearchQuery] = useState('');
  const [unpaidSearchQuery, setUnpaidSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSubForInvoice, setSelectedSubForInvoice] = useState<Subscriber | null>(null);
  const [selectedSubForDetails, setSelectedSubForDetails] = useState<Subscriber | null>(null);

  // Forms states
  const [newSub, setNewSub] = useState({ name: '', phone: '', notes: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true });
  const [renewForm, setRenewForm] = useState({ name: '', subId: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSubscribers(parsed);
      } catch (e) { console.error("Error loading subscribers", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
  }, [subscribers]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) setView('dashboard');
    else alert("كلمة المرور غير صحيحة!");
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تطبيق المؤمن نت',
          text: 'نظام إدارة مشتركين الإنترنت الاحترافي - المؤمن نت',
          url: window.location.href,
        });
      } catch (err) { console.log('User cancelled share'); }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط التطبيق! يمكنك إرساله الآن عبر واتساب.');
    }
  };

  const getRemainingTime = (expiryDate: string) => {
    if (!expiryDate) return "غير متوفر";
    try {
      const diff = new Date(expiryDate).getTime() - currentTime.getTime();
      if (diff <= 0) return "منتهي";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `${days} يوم و ${hours} ساعة`;
    } catch (e) { return "خطأ في التاريخ"; }
  };

  const addSubscriber = () => {
    const { name, phone, notes, amount, isCustomAmount, customAmount, payNow } = newSub;
    if (!name || !phone) return alert("يرجى إكمال البيانات (الاسم ورقم الهاتف)");
    const finalAmount = isCustomAmount ? Number(customAmount) : amount;
    if (isCustomAmount && !customAmount) return alert("يرجى إدخال المبلغ المخصص");
    
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sub: Subscriber = {
      id: "ID-" + Date.now().toString(),
      name: name.trim(), phone: phone.trim(),
      notes: notes.trim(),
      joinDate: now.toISOString(),
      planName: `باقة ${finalAmount.toLocaleString()}`,
      subscriptionAmount: finalAmount, isPaid: payNow,
      activationDate: now.toISOString(), expiryDate: expiry.toISOString(),
      lastPaymentDate: payNow ? now.toISOString() : '',
      debtHistory: [{ id: Math.random().toString(36).substr(2, 9), month: now.toISOString().slice(0, 7), amount: finalAmount, isPaid: payNow, createdAt: now.toISOString() }]
    };
    setSubscribers(prev => [...prev, sub]);
    alert("تمت إضافة المشترك بنجاح!");
    setView('subscribers');
    setNewSub({ name: '', phone: '', notes: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true });
  };

  const renewSubscriber = () => {
    if (!renewForm.subId) return alert("يرجى اختيار المشترك");
    const subIndex = subscribers.findIndex(s => s.id === renewForm.subId);
    if (subIndex === -1) return alert("المشترك غير موجود.");
    
    const amount = renewForm.isCustomAmount ? Number(renewForm.customAmount) : renewForm.amount;
    const now = new Date();
    const oldExpiry = new Date(subscribers[subIndex].expiryDate);
    const startDate = oldExpiry > now ? oldExpiry : now;
    const expiry = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    setSubscribers(prev => {
      const updated = [...prev];
      const s = { ...updated[subIndex] };
      updated[subIndex] = {
        ...s, planName: `باقة ${amount.toLocaleString()}`, subscriptionAmount: amount,
        isPaid: renewForm.payNow, activationDate: now.toISOString(), expiryDate: expiry.toISOString(),
        lastPaymentDate: renewForm.payNow ? now.toISOString() : s.lastPaymentDate,
        debtHistory: [...(s.debtHistory || []), { id: Math.random().toString(36).substr(2, 9), month: now.toISOString().slice(0, 7), amount: amount, isPaid: renewForm.payNow, createdAt: now.toISOString() }]
      };
      return updated;
    });
    alert(`تم تجديد الاشتراك بنجاح!`);
    setView('subscribers');
    setRenewForm({ name: '', subId: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true });
    setRenewalSearchQuery('');
  };

  const confirmDeleteSubscriber = (id: string, name: string) => {
    if (window.confirm(`تأكيد الحذف النهائي:\nهل أنت متأكد من مسح المشترك "${name}"؟`)) {
      setSubscribers(prev => prev.filter(sub => sub.id !== id));
      alert(`تم حذف المشترك بنجاح.`);
    }
  };

  const settleDebt = (subId: string, debtId: string) => {
    setSubscribers(prev => prev.map(s => {
      if (s.id === subId) {
        const updatedHistory = (s.debtHistory || []).map(d => d.id === debtId ? { ...d, isPaid: true } : d);
        return { ...s, debtHistory: updatedHistory, isPaid: true, lastPaymentDate: new Date().toISOString() };
      }
      return s;
    }));
  };

  const totalDebt = subscribers.reduce((acc, sub) => acc + (sub.debtHistory || []).filter(d => !d.isPaid).reduce((sum, d) => sum + d.amount, 0), 0);
  
  // حساب عدد المشتركين "سحب واير" و "برج ايجار" من الملاحظات
  const wirePullSubscribers = subscribers.filter(s => s.notes?.includes('سحب واير'));
  const rentedTowerSubscribers = subscribers.filter(s => s.notes?.includes('برج ايجار'));

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 text-right" dir="rtl">
        <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl text-center">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3"><Users className="text-white w-10 h-10" /></div>
          <h1 className="text-2xl font-black text-slate-800 mb-8 font-tajawal">مكتب المؤمن نت</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="كلمة المرور" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-xl font-bold focus:border-emerald-500 transition-all outline-none" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <button className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all">تسجيل الدخول</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'invoice' && selectedSubForInvoice) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-right font-tajawal" dir="rtl">
        <div className="max-w-2xl mx-auto bg-white border-4 border-slate-900 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <Wifi className="absolute -top-6 -left-6 text-blue-500/10 rotate-12" size={120} />
          <Router className="absolute bottom-20 -right-10 text-emerald-500/10 -rotate-12" size={150} />
          <Signal className="absolute top-1/2 left-4 text-blue-500/5" size={80} />

          <div className="flex justify-between items-center mb-10 border-b-4 border-slate-900 pb-6 relative z-10">
            <div>
              <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                مكتب المؤمن نت
              </h1>
              <p className="text-slate-600 font-black text-lg">وصل تفعيل اشتراك إنترنت</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Wifi size={32} /></div>
              <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><Router size={32} /></div>
            </div>
          </div>

          <div className="space-y-8 text-2xl relative z-10">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <span className="text-slate-500 font-bold">اسم المشترك:</span>
              <span className="font-black text-slate-900">{selectedSubForInvoice.name}</span>
            </div>
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <span className="text-slate-500 font-bold">نوع الباقة:</span>
              <span className="font-black text-blue-600 flex items-center gap-2">
                <Globe size={24} className="text-blue-400" />
                {selectedSubForInvoice.planName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                <p className="text-sm text-slate-400 font-black mb-1">تاريخ التفعيل</p>
                <p className="font-black text-slate-800">{new Date(selectedSubForInvoice.activationDate).toLocaleDateString('ar-IQ')}</p>
              </div>
              <div className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-100">
                <p className="text-sm text-rose-400 font-black mb-1">تاريخ الانتهاء</p>
                <p className="font-black text-rose-600">{new Date(selectedSubForInvoice.expiryDate).toLocaleDateString('ar-IQ')}</p>
              </div>
            </div>
            <div className="pt-6">
              <div className="flex justify-between items-center bg-emerald-600 text-white p-6 rounded-[32px] shadow-xl shadow-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl"><DollarSign size={28} /></div>
                  <span className="font-black">المبلغ المسدد:</span>
                </div>
                <span className="font-black text-4xl">{selectedSubForInvoice.isPaid ? selectedSubForInvoice.subscriptionAmount.toLocaleString() : 0} <small className="text-xl">د.ع</small></span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-slate-300 relative z-10">
             <Signal size={24} />
             <div className="h-1 w-20 bg-slate-100 rounded-full"></div>
             <Globe size={24} />
             <div className="h-1 w-20 bg-slate-100 rounded-full"></div>
             <Router size={24} />
          </div>

          <div className="mt-10 flex gap-4 no-print relative z-10">
            <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"><Printer /> طباعة الوصل</button>
            <button onClick={() => setView('subscribers')} className="px-8 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black active:scale-95 transition-all border-2 border-slate-200">إغلاق</button>
          </div>
        </div>
      </div>
    );
  }

  // استخدام startsWith بدلاً من includes بناءً على طلب المستخدم
  const filteredRenewalSubscribers = subscribers.filter(s => 
    s.name.toLowerCase().startsWith(renewalSearchQuery.toLowerCase()) || 
    s.phone.startsWith(renewalSearchQuery)
  );

  const filteredUnpaidSubscribers = subscribers.filter(s => 
    (s.debtHistory || []).some(d => !d.isPaid) && 
    (s.name.toLowerCase().startsWith(unpaidSearchQuery.toLowerCase()) || s.phone.startsWith(unpaidSearchQuery))
  );

  const filteredFullListSubscribers = subscribers.filter(s => 
    s.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const filteredSubscribersCards = subscribers.filter(s => 
    s.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  const renderGenericList = (title: string, data: Subscriber[], icon: React.ReactNode, accentColor: string) => (
    <div className="space-y-6">
      <div className={`bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden`}>
        <div className={`p-8 border-b bg-slate-50 flex justify-between items-center`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-${accentColor}-50 text-${accentColor}-600`}>{icon}</div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">{title}</h2>
              <p className="text-slate-500 font-bold">عرض القائمة المفلترة حسب الملاحظات</p>
            </div>
          </div>
          <div className={`bg-white px-4 py-2 rounded-2xl border font-black text-${accentColor}-600`}>
            {data.length} مشترك
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-wider">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((s, index) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-400 tabular-nums">{index + 1}</td>
                  <td className="px-6 py-4 font-black text-slate-800">{s.name}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedSubForDetails(s)}
                      className={`inline-flex items-center gap-2 bg-${accentColor}-50 text-${accentColor}-600 px-5 py-2 rounded-xl font-black hover:bg-${accentColor}-600 hover:text-white transition-all active:scale-95 shadow-sm`}
                    >
                      <FileText size={18}/> التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-400 font-bold">لا يوجد مشتركون في هذه القائمة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <button onClick={() => setView('dashboard')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg">العودة للرئيسية</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 lg:pb-0 lg:pr-64 text-right font-tajawal" dir="rtl">
      {/* Subscriber Details Modal */}
      {selectedSubForDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden relative">
            <button onClick={() => setSelectedSubForDetails(null)} className="absolute left-6 top-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-all">
              <X size={24} />
            </button>
            <div className="p-8 pt-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
                  <UserPlus size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedSubForDetails.name}</h3>
                  <p className="text-slate-400 font-bold">{selectedSubForDetails.phone}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 mb-2 flex items-center gap-2"><Info size={16}/> الملاحظات</h4>
                  <p className="text-slate-700 font-bold leading-relaxed">{selectedSubForDetails.notes || 'لا توجد ملاحظات مسجلة.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-3xl">
                    <h4 className="text-xs font-black text-emerald-400 mb-1">تاريخ التفعيل</h4>
                    <p className="font-black text-emerald-700">
                      {new Date(selectedSubForDetails.activationDate).toLocaleDateString('ar-IQ')}
                      <br/>
                      <small className="text-[10px] tabular-nums">{new Date(selectedSubForDetails.activationDate).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</small>
                    </p>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-3xl">
                    <h4 className="text-xs font-black text-rose-400 mb-1">تاريخ الانتهاء</h4>
                    <p className="font-black text-rose-700">
                      {new Date(selectedSubForDetails.expiryDate).toLocaleDateString('ar-IQ')}
                      <br/>
                      <small className="text-[10px] tabular-nums">{new Date(selectedSubForDetails.expiryDate).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</small>
                    </p>
                  </div>
                </div>

                {selectedSubForDetails.debtHistory.filter(d => !d.isPaid).length > 0 ? (
                  <div className="bg-rose-600 p-5 rounded-3xl text-white shadow-lg shadow-rose-100">
                    <h4 className="text-xs font-black opacity-70 mb-2">الديون المستحقة</h4>
                    {selectedSubForDetails.debtHistory.filter(d => !d.isPaid).map(debt => (
                      <div key={debt.id} className="flex justify-between items-center border-t border-white/10 pt-2 mt-2 first:mt-0 first:border-0 first:pt-0">
                        <span className="font-bold">شهر: {debt.month}</span>
                        <span className="font-black text-lg">{debt.amount.toLocaleString()} د.ع</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-600 p-5 rounded-3xl text-white flex items-center gap-3">
                    <CheckCircle size={24} />
                    <span className="font-black">لا توجد ديون مسجلة</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedSubForDetails(null)}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black active:scale-95 transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-slate-200 p-8 z-50">
        <div className="flex items-center gap-3 mb-10"><div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"><Users size={24} /></div><h2 className="text-xl font-black text-slate-800">المؤمن نت</h2></div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
            { id: 'subscribers', label: 'إدارة المشتركين', icon: Users },
            { id: 'full-list', label: 'القائمة الكاملة', icon: List },
            { id: 'renewal', label: 'تجديد اشتراك', icon: RefreshCcw },
            { id: 'unpaid', label: 'سجل الديون', icon: AlertCircle },
            { id: 'add-subscriber', label: 'إضافة جديد', icon: PlusCircle },
            { id: 'delete-sub', label: 'حذف مشترك', icon: UserMinus },
          ].map((item) => (
            <button key={item.id} onClick={() => { setView(item.id as ViewState); setSearchQuery(''); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
              <item.icon size={20} /><span>{item.label}</span>
            </button>
          ))}
          <button onClick={handleShareApp} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-blue-600 hover:bg-blue-50 mt-4"><Share2 size={20} /><span>مشاركة التطبيق</span></button>
        </nav>
        <button onClick={() => setView('login')} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50 mt-auto"><LogOut size={20} /> خروج</button>
      </aside>

      <main className="max-w-6xl mx-auto p-5 lg:p-12">
        <header className="mb-10 flex flex-col items-center gap-4 relative">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border shadow-sm text-slate-600 font-bold order-2 md:order-1">
              <Clock size={20} className="text-emerald-500" />
              <span className="text-lg tabular-nums">
                {currentTime.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-center order-1 md:order-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                مكتب المؤمن نت
              </span>
            </h1>
            <div className="w-12 h-12 hidden md:block order-3"></div>
          </div>
          {view !== 'dashboard' && (
             <div className="bg-slate-100 px-6 py-1 rounded-full text-slate-500 font-black text-sm uppercase tracking-wider">
                {view === 'subscribers' && "إدارة المشتركين"}
                {view === 'full-list' && "القائمة العامة"}
                {view === 'renewal' && "تجديد الاشتراكات"}
                {view === 'unpaid' && "الديون والتحصيل"}
                {view === 'add-subscriber' && "إضافة مشترك جديد"}
                {view === 'delete-sub' && "إدارة الحذف"}
                {view === 'wire-list' && "قائمة سحب واير"}
                {view === 'tower-list' && "قائمة برج ايجار"}
             </div>
          )}
        </header>

        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                <div><p className="text-slate-400 font-bold mb-1 text-sm">إجمالي المشتركين</p><p className="text-4xl font-black text-emerald-600 tabular-nums">{subscribers.length}</p></div>
                <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-500"><Users size={32} /></div>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
                <div><p className="text-slate-400 font-bold mb-1 text-sm">الديون الكلية</p><p className="text-3xl font-black text-rose-600 tabular-nums">{totalDebt.toLocaleString()}</p></div>
                <div className="bg-rose-50 p-4 rounded-3xl text-rose-500"><DollarSign size={32} /></div>
              </div>
              {/* خانة سحب واير - قابلة للضغط */}
              <button onClick={() => setView('wire-list')} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all text-right group hover:border-blue-200">
                <div><p className="text-slate-400 font-bold mb-1 text-sm group-hover:text-blue-500">سحب واير</p><p className="text-4xl font-black text-blue-600 tabular-nums">{wirePullSubscribers.length}</p></div>
                <div className="bg-blue-50 p-4 rounded-3xl text-blue-500"><Cable size={32} /></div>
              </button>
              {/* خانة برج ايجار - قابلة للضغط */}
              <button onClick={() => setView('tower-list')} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-all text-right group hover:border-amber-200">
                <div><p className="text-slate-400 font-bold mb-1 text-sm group-hover:text-amber-500">برج ايجار</p><p className="text-4xl font-black text-amber-600 tabular-nums">{rentedTowerSubscribers.length}</p></div>
                <div className="bg-amber-50 p-4 rounded-3xl text-amber-600"><Tower size={32} /></div>
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <button onClick={() => setView('add-subscriber')} className="bg-blue-50 p-8 rounded-[30px] flex flex-col items-center gap-3 text-blue-600 hover:bg-blue-100 transition-all font-black border-2 border-blue-100"><PlusCircle size={32}/><span className="text-lg">إضافة جديد</span></button>
              <button onClick={() => setView('full-list')} className="bg-slate-100 p-8 rounded-[30px] flex flex-col items-center gap-3 text-slate-600 hover:bg-slate-200 transition-all font-black border-2 border-slate-200"><List size={32}/><span className="text-lg">القائمة الكاملة</span></button>
              <button onClick={() => setView('renewal')} className="bg-emerald-50 p-8 rounded-[30px] flex flex-col items-center gap-3 text-emerald-600 hover:bg-emerald-100 transition-all font-black border-2 border-emerald-100"><RefreshCcw size={32}/><span className="text-lg">تجديد</span></button>
            </div>
          </div>
        )}

        {view === 'subscribers' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input type="text" placeholder="ابحث عن بداية اسم المشترك..." className="w-full px-14 py-5 bg-white border border-slate-100 rounded-3xl shadow-sm font-bold text-lg outline-none focus:border-emerald-400 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {filteredSubscribersCards.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[32px] border-2 border-slate-50 shadow-sm relative group hover:border-emerald-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div><h3 className="text-xl font-black text-slate-800">{s.name}</h3><p className="text-slate-400 font-bold">{s.phone}</p></div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black ${s.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{s.isPaid ? 'مسدد' : 'دين'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[10px] text-slate-400 font-black mb-1">المتبقي</p><p className="text-sm font-black text-blue-600 flex items-center gap-1"><Clock size={14}/> {getRemainingTime(s.expiryDate)}</p></div>
                    <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[10px] text-slate-400 font-black mb-1">تاريخ الانتهاء</p><p className="text-sm font-bold text-slate-700">{new Date(s.expiryDate).toLocaleDateString('ar-IQ')}</p></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setSelectedSubForInvoice(s); setView('invoice'); }} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"><Printer size={18}/> وصل</button>
                    <button onClick={() => confirmDeleteSubscriber(s.id, s.name)} className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
              {filteredSubscribersCards.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-bold">لا يوجد نتائج تطابق بحثك.</div>}
            </div>
          </div>
        )}

        {view === 'full-list' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" 
                placeholder="ابحث عن بداية اسم المشترك في القائمة الكاملة..." 
                className="w-full px-14 py-5 bg-white border border-slate-100 rounded-3xl shadow-sm font-bold text-lg outline-none focus:border-emerald-400 transition-all" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">قائمة جميع المشتركين</h2>
                    <p className="text-slate-500 font-bold">عرض تفصيلي لجميع البيانات المسجلة</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-2xl border font-black text-emerald-600">
                    {filteredFullListSubscribers.length} مشترك
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-wider">
                          <th className="px-6 py-4">#</th>
                          <th className="px-6 py-4">الاسم</th>
                          <th className="px-6 py-4 text-center">التفاصيل</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFullListSubscribers.map((s, index) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-black text-slate-400 tabular-nums">{index + 1}</td>
                            <td className="px-6 py-4 font-black text-slate-800">{s.name}</td>
                            <td className="px-6 py-4 text-center">
                                <button 
                                  onClick={() => setSelectedSubForDetails(s)}
                                  className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2 rounded-xl font-black hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                >
                                  <FileText size={18}/> التفاصيل
                                </button>
                            </td>
                          </tr>
                        ))}
                        {filteredFullListSubscribers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-20 text-center text-slate-400 font-bold">لا توجد نتائج مطابقة للبحث.</td>
                          </tr>
                        )}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        )}

        {view === 'wire-list' && renderGenericList("مشتركو سحب واير", wirePullSubscribers, <Cable size={24}/>, "blue")}
        {view === 'tower-list' && renderGenericList("مشتركو برج ايجار", rentedTowerSubscribers, <Tower size={24}/>, "amber")}

        {view === 'renewal' && (
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border-2 border-emerald-50 max-w-2xl mx-auto">
            <h2 className="text-2xl font-black mb-8 text-emerald-600 flex items-center gap-2"><RefreshCcw /> تجديد اشتراك مشترك</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-black text-slate-700 text-sm">ابحث عن بداية اسم المشترك</label>
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="اكتب بداية الاسم للبحث..." 
                    className="w-full px-12 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-emerald-400"
                    value={renewalSearchQuery}
                    onChange={e => setRenewalSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-black text-slate-700 text-sm">اختر المشترك من القائمة</label>
                <select className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-emerald-400" value={renewForm.subId} onChange={e => {
                  const s = subscribers.find(sub => sub.id === e.target.value);
                  setRenewForm({...renewForm, subId: e.target.value, name: s?.name || '', amount: s?.subscriptionAmount || 35000});
                }}>
                  <option value="">-- اختر من القائمة ({filteredRenewalSubscribers.length}) --</option>
                  {filteredRenewalSubscribers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-black text-slate-700 text-sm">المبلغ المستحق (د.ع)</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.slice(0, 6).map(amt => (
                    <button key={amt} onClick={() => setRenewForm({...renewForm, amount: amt, isCustomAmount: false})} className={`py-3 rounded-xl font-bold text-sm transition-all ${!renewForm.isCustomAmount && renewForm.amount === amt ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <button onClick={() => setRenewForm({...renewForm, isCustomAmount: true})} className={`w-full mt-2 py-3 rounded-xl font-bold ${renewForm.isCustomAmount ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>مبلغ مخصص</button>
                {renewForm.isCustomAmount && <input type="number" placeholder="أدخل المبلغ..." className="w-full mt-2 px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-emerald-400" value={renewForm.customAmount} onChange={e => setRenewForm({...renewForm, customAmount: e.target.value})} />}
              </div>
              <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl cursor-pointer">
                <input type="checkbox" className="w-6 h-6 rounded-lg accent-emerald-600" checked={renewForm.payNow} onChange={e => setRenewForm({...renewForm, payNow: e.target.checked})} />
                <span className="font-black text-emerald-800">تم استلام المبلغ نقداً (تسديد)</span>
              </label>
              <div className="flex gap-4 pt-4">
                <button onClick={renewSubscriber} className="flex-1 bg-emerald-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 active:scale-95 transition-all">تأكيد التجديد</button>
                <button onClick={() => { setView('dashboard'); setRenewalSearchQuery(''); }} className="px-10 bg-slate-100 text-slate-500 rounded-3xl font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {view === 'unpaid' && (
          <div className="space-y-6">
            <div className="bg-rose-600 p-8 rounded-[40px] text-white flex justify-between items-center shadow-xl">
              <div><h2 className="text-2xl font-black mb-1">الديون المستحقة</h2><p className="font-bold opacity-80">إجمالي المبالغ غير المحصلة</p></div>
              <div className="text-4xl font-black tabular-nums">{totalDebt.toLocaleString()} د.ع</div>
            </div>
            
            <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" 
                placeholder="ابحث عن بداية اسم المشترك لتسديد دينه..." 
                className="w-full px-14 py-5 bg-white border border-rose-100 rounded-3xl shadow-sm font-bold text-lg outline-none focus:border-rose-400 transition-all" 
                value={unpaidSearchQuery} 
                onChange={e => setUnpaidSearchQuery(e.target.value)} 
              />
            </div>

            <div className="grid gap-6">
              {filteredUnpaidSubscribers.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[32px] border-2 border-rose-50 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div><h3 className="text-xl font-black text-slate-800">{s.name}</h3><p className="text-slate-400 font-bold">{s.phone}</p></div>
                    <a href={`https://wa.me/${s.phone}`} target="_blank" className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold"><Send size={18}/> مراسلة</a>
                  </div>
                  <div className="space-y-3">
                    {(s.debtHistory || []).filter(d => !d.isPaid).map(d => (
                      <div key={d.id} className="flex justify-between items-center bg-rose-50 p-4 rounded-2xl">
                        <div><p className="text-xs font-black text-rose-400">شهر: {d.month}</p><p className="font-black text-rose-700 tabular-nums">{d.amount.toLocaleString()} د.ع</p></div>
                        <button onClick={() => settleDebt(s.id, d.id)} className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-rose-100 active:scale-95 transition-all">تسديد</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredUnpaidSubscribers.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-bold bg-white rounded-[40px] border border-dashed border-slate-200">
                  لا توجد ديون مطابقة لبداية هذا البحث.
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'add-subscriber' && (
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border-2 border-blue-50 max-w-3xl mx-auto">
            <h2 className="text-2xl font-black mb-8 text-blue-600 flex items-center gap-2"><UserPlus /> إضافة مشترك جديد للنظام</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-black text-slate-700 text-sm">اسم المشترك الثلاثي</label>
                <input type="text" placeholder="مثال: محمد علي حسن" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-blue-400" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="font-black text-slate-700 text-sm">رقم الموبايل</label>
                <input type="tel" placeholder="077XXXXXXXX" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-blue-400" value={newSub.phone} onChange={e => setNewSub({...newSub, phone: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-black text-slate-700 text-sm">ملاحظات المشترك (الموقع، تفاصيل إضافية)</label>
                <textarea 
                  placeholder="أدخل ملاحظات أو موقع المشترك هنا... (اكتب 'سحب واير' أو 'برج ايجار' لتصنيفه)" 
                  className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-blue-400 min-h-[100px]" 
                  value={newSub.notes} 
                  onChange={e => setNewSub({...newSub, notes: e.target.value})} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-black text-slate-700 text-sm">اختر مبلغ الاشتراك</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => setNewSub({...newSub, amount: amt, isCustomAmount: false})} className={`py-4 rounded-xl font-bold transition-all ${!newSub.isCustomAmount && newSub.amount === amt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {amt.toLocaleString()}
                    </button>
                  ))}
                  <button onClick={() => setNewSub({...newSub, isCustomAmount: true})} className={`py-4 rounded-xl font-bold transition-all ${newSub.isCustomAmount ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    مبلغ مخصص
                  </button>
                </div>
                {newSub.isCustomAmount && (
                  <input 
                    type="number" 
                    placeholder="أدخل المبلغ المخصص هنا..." 
                    className="w-full mt-3 px-5 py-4 bg-slate-50 border-2 border-blue-100 rounded-2xl font-bold outline-none focus:border-blue-400 transition-all" 
                    value={newSub.customAmount} 
                    onChange={e => setNewSub({...newSub, customAmount: e.target.value})} 
                  />
                )}
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl cursor-pointer">
                <input type="checkbox" className="w-6 h-6 rounded-lg accent-blue-600" checked={newSub.payNow} onChange={e => setNewSub({...newSub, payNow: e.target.checked})} />
                <span className="font-black text-blue-800">تم استلام المبلغ نقداً فوراً</span>
              </label>
              <div className="flex gap-4">
                <button onClick={addSubscriber} className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-blue-100 active:scale-95 transition-all">حفظ المشترك</button>
                <button onClick={() => setView('dashboard')} className="px-10 bg-slate-100 text-slate-500 rounded-3xl font-bold">رجوع</button>
              </div>
            </div>
          </div>
        )}

        {view === 'delete-sub' && (
          <div className="space-y-6">
             <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input type="text" placeholder="ابحث عن بداية اسم لحذفه..." className="w-full px-14 py-5 bg-white border border-rose-100 rounded-3xl shadow-sm font-bold text-lg outline-none focus:border-rose-400 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-rose-50">
                <h2 className="text-xl font-black text-rose-700">حذف نهائي للمشتركين</h2>
                <p className="text-rose-500 font-bold text-sm">كن حذراً، لا يمكن التراجع عن الحذف.</p>
              </div>
              <div className="divide-y">
                {subscribers.filter(s => s.name.toLowerCase().startsWith(searchQuery.toLowerCase())).map(s => (
                  <div key={s.id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                    <div><p className="font-black text-slate-800">{s.name}</p><p className="text-slate-400 text-sm font-bold">{s.phone}</p></div>
                    <button onClick={() => confirmDeleteSubscriber(s.id, s.name)} className="bg-rose-100 text-rose-600 p-3 rounded-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={22}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) with full-circle pulse animation */}
      <button 
        onClick={() => setView('add-subscriber')}
        className={`fixed bottom-28 right-6 z-[110] lg:right-12 lg:bottom-12 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all duration-300 group animate-pulse-button ${view === 'add-subscriber' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 group-hover:hidden"></div>
        <Plus size={32} strokeWidth={3} className="relative z-10" />
      </button>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t px-6 py-4 flex justify-between items-center z-[100] rounded-t-[35px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'full-list', icon: List },
          { id: 'add-subscriber', icon: UserPlus },
          { id: 'renewal', icon: RefreshCcw },
          { id: 'unpaid', icon: AlertCircle },
        ].map(item => (
          <button key={item.id} onClick={() => { setView(item.id as ViewState); setSearchQuery(''); setRenewalSearchQuery(''); setUnpaidSearchQuery(''); }} className={`p-4 rounded-2xl transition-all duration-300 ${view === item.id ? 'bg-emerald-600 text-white -translate-y-6 shadow-2xl scale-110' : 'text-slate-400 hover:text-emerald-500'}`}>
            <item.icon size={26} />
          </button>
        ))}
      </nav>
      
      <style>{`
        .font-tajawal { font-family: 'Tajawal', sans-serif; }
        body { -webkit-tap-highlight-color: transparent; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        
        @keyframes pulse-button {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-button { animation: pulse-button 2s infinite ease-in-out; }

        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .min-h-screen { min-height: auto; padding: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;
