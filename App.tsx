import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, LayoutDashboard, Search, PlusCircle, AlertCircle, LogOut, 
  Calendar as CalendarIcon, DollarSign, Trash2, 
  RefreshCcw, CheckCircle, Printer, Clock, Plus, UserPlus, UserMinus, ChevronLeft, Share2, Info, Sparkles, Send,
  Wifi, Router, Signal, Globe, List, FileText, X, Cable, TowerControl as Tower, Calendar, MapPin, Phone, CreditCard, Wallet,
  Moon, Sun, Facebook, MessageCircle
} from 'lucide-react';
import { Subscriber, ViewState, DebtMonth } from './types';

const ORIGINAL_PASSWORD = "ALMOMEN1995";
const TEMP_PASSWORD = "12345";
const TEMP_START_KEY = "almomin_temp_pass_start_v1";
const STORAGE_KEY = "almomin_net_pro_v1";
const THEME_KEY = "almomin_theme_v1";

const PRESET_AMOUNTS = [25000, 30000, 35000, 40000, 45000, 50000, 55000];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

const MAIN_SWIPE_VIEWS: ViewState[] = ['dashboard', 'subscribers', 'full-list', 'renewal', 'unpaid', 'add-subscriber'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('login');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [renewalSearchQuery, setRenewalSearchQuery] = useState('');
  const [unpaidSearchQuery, setUnpaidSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSubForInvoice, setSelectedSubForInvoice] = useState<Subscriber | null>(null);
  const [selectedSubForDetails, setSelectedSubForDetails] = useState<Subscriber | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Swipe logic refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const [newSub, setNewSub] = useState({ 
    name: '', phone: '', notes: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true,
    dateType: 'now', day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  const [renewForm, setRenewForm] = useState({ 
    name: '', subId: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true,
    dateType: 'now', day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

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

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark') setIsDarkMode(true);

    if (!localStorage.getItem(TEMP_START_KEY)) {
      localStorage.setItem(TEMP_START_KEY, Date.now().toString());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
  }, [subscribers]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const sendWhatsAppNotification = (subscriberName: string, amount: number) => {
    const targetNumber = "9647502379869"; 
    const text = `تم تسديد اشتراك "${subscriberName}" بنجاح، المبلغ المسدد: ${amount.toLocaleString()} د.ع واصل`;
    const url = `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const startTimeStr = localStorage.getItem(TEMP_START_KEY);
    const startTime = startTimeStr ? parseInt(startTimeStr) : Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000; 
    const isTempValid = (Date.now() - startTime) < threeDays;
    const validPassword = isTempValid ? TEMP_PASSWORD : ORIGINAL_PASSWORD;

    if (password === validPassword) {
      setView('dashboard');
      setLoginError(false);
      setFailedAttempts(0);
    } else {
      setLoginError(true);
      setFailedAttempts(prev => prev + 1);
      setPassword(''); 
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
    } catch (e) { return "خطأ"; }
  };

  const constructDate = (type: string, d: number, m: number, y: number) => {
    const now = new Date();
    if (type === 'now') return now;
    const date = new Date(y, m - 1, d);
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return date;
  };

  const addSubscriber = () => {
    const { name, phone, notes, amount, isCustomAmount, customAmount, payNow, dateType, day, month, year } = newSub;
    if (!name || !phone) return alert("يرجى إكمال البيانات");
    const finalAmount = isCustomAmount ? Number(customAmount) : amount;
    
    const activationDate = constructDate(dateType, day, month, year);
    const expiry = new Date(activationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const sub: Subscriber = {
      id: "ID-" + Date.now().toString(),
      name: name.trim(), phone: phone.trim(),
      notes: notes.trim(),
      joinDate: activationDate.toISOString(),
      planName: `باقة ${finalAmount.toLocaleString()}`,
      subscriptionAmount: finalAmount, isPaid: payNow,
      activationDate: activationDate.toISOString(), expiryDate: expiry.toISOString(),
      lastPaymentDate: payNow ? activationDate.toISOString() : '',
      debtHistory: [{ 
        id: Math.random().toString(36).substr(2, 9), 
        month: activationDate.toISOString().slice(0, 7), 
        amount: finalAmount, 
        isPaid: payNow, 
        createdAt: activationDate.toISOString() 
      }]
    };
    setSubscribers(prev => [...prev, sub]);
    alert("تمت إضافة المشترك بنجاح!");
    
    if (payNow) {
      sendWhatsAppNotification(name.trim(), finalAmount);
    }

    setView('subscribers');
    setNewSub({ 
      name: '', phone: '', notes: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true,
      dateType: 'now', day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear()
    });
  };

  const renewSubscriber = () => {
    if (!renewForm.subId) return alert("يرجى اختيار المشترك");
    const subIndex = subscribers.findIndex(s => s.id === renewForm.subId);
    if (subIndex === -1) return alert("المشترك غير موجود.");
    
    const amount = renewForm.isCustomAmount ? Number(renewForm.customAmount) : renewForm.amount;
    const activationDate = constructDate(renewForm.dateType, renewForm.day, renewForm.month, renewForm.year);
    const expiry = new Date(activationDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    setSubscribers(prev => {
      const updated = [...prev];
      const s = { ...updated[subIndex] };
      updated[subIndex] = {
        ...s, planName: `باقة ${amount.toLocaleString()}`, subscriptionAmount: amount,
        isPaid: renewForm.payNow, activationDate: activationDate.toISOString(), expiryDate: expiry.toISOString(),
        lastPaymentDate: renewForm.payNow ? activationDate.toISOString() : s.lastPaymentDate,
        debtHistory: [...(s.debtHistory || []), { 
          id: Math.random().toString(36).substr(2, 9), 
          month: activationDate.toISOString().slice(0, 7), 
          amount: amount, 
          isPaid: renewForm.payNow, 
          createdAt: activationDate.toISOString() 
        }]
      };
      return updated;
    });
    alert(`تم تجديد الاشتراك بنجاح!`);
    
    if (renewForm.payNow) {
      sendWhatsAppNotification(renewForm.name, amount);
    }

    setView('subscribers');
    setRenewForm({ 
      name: '', subId: '', amount: 35000, isCustomAmount: false, customAmount: '', payNow: true,
      dateType: 'now', day: new Date().getDate(), month: new Date().getMonth() + 1, year: new Date().getFullYear()
    });
  };

  const settleDebt = (subId: string, debtId: string) => {
    const sub = subscribers.find(s => s.id === subId);
    const debtRecord = sub?.debtHistory?.find(d => d.id === debtId);
    const paidAmount = debtRecord?.amount || 0;

    setSubscribers(prev => prev.map(s => {
      if (s.id === subId) {
        const updatedHistory = (s.debtHistory || []).map(d => d.id === debtId ? { ...d, isPaid: true } : d);
        return { ...s, debtHistory: updatedHistory, isPaid: true, lastPaymentDate: new Date().toISOString() };
      }
      return s;
    }));
    
    alert("تم تسديد الدين بنجاح!");
    if (sub) {
      sendWhatsAppNotification(sub.name, paidAmount);
    }
  };

  const confirmDeleteSubscriber = (id: string, name: string) => {
    if (window.confirm(`تأكيد الحذف النهائي للمشترك "${name}"؟`)) {
      setSubscribers(prev => prev.filter(sub => sub.id !== id));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSearching || view === 'login' || view === 'invoice') return;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSearching || !touchStartX.current || view === 'login' || view === 'invoice') return;
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 80;

    const currentIndex = MAIN_SWIPE_VIEWS.indexOf(view);
    if (currentIndex === -1) return;

    if (diff > threshold) {
      const nextIndex = (currentIndex + 1) % MAIN_SWIPE_VIEWS.length;
      setView(MAIN_SWIPE_VIEWS[nextIndex]);
      setSearchQuery('');
    } else if (diff < -threshold) {
      const prevIndex = (currentIndex - 1 + MAIN_SWIPE_VIEWS.length) % MAIN_SWIPE_VIEWS.length;
      setView(MAIN_SWIPE_VIEWS[prevIndex]);
      setSearchQuery('');
    }
    touchStartX.current = null;
  };

  const totalDebt = subscribers.reduce((acc, sub) => acc + (sub.debtHistory || []).filter(d => !d.isPaid).reduce((sum, d) => sum + d.amount, 0), 0);
  const wirePullSubscribers = subscribers.filter(s => s.notes?.includes('سحب واير'));
  const rentedTowerSubscribers = subscribers.filter(s => s.notes?.includes('برج ايجار'));

  const filteredSubscribersCards = subscribers.filter(s => s.name.toLowerCase().startsWith(searchQuery.toLowerCase()));
  const filteredFullListSubscribers = subscribers.filter(s => s.name.toLowerCase().startsWith(searchQuery.toLowerCase()));
  const filteredRenewalSubscribers = subscribers.filter(s => s.name.toLowerCase().startsWith(renewalSearchQuery.toLowerCase()));
  const filteredUnpaidSubscribers = subscribers.filter(s => (s.debtHistory || []).some(d => !d.isPaid) && s.name.toLowerCase().includes(unpaidSearchQuery.toLowerCase()));

  const DetailsModal = ({ subscriber, onClose }: { subscriber: Subscriber, onClose: () => void }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-900' : 'bg-white'} w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200`}>
        <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
          <h2 className="text-xl font-black flex items-center gap-2"><Info size={24} className="text-emerald-400" /> تفاصيل المشترك</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
        </div>
        <div className="p-8 space-y-4 text-right">
          <div className="flex flex-col items-center mb-6">
            <div className={`w-20 h-20 ${isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-600'} rounded-3xl flex items-center justify-center mb-3 font-black text-3xl`}>{subscriber.name.charAt(0)}</div>
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{subscriber.name}</h3>
            <p className="text-slate-400 font-bold tabular-nums">{subscriber.phone}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-4 rounded-2xl`}><p className="text-[10px] text-slate-400 font-black mb-1">تاريخ التفعيل</p><p className={`font-bold tabular-nums ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(subscriber.activationDate).toLocaleDateString('ar-IQ')}</p></div>
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-4 rounded-2xl`}><p className="text-[10px] text-slate-400 font-black mb-1">تاريخ الانتهاء</p><p className={`font-bold tabular-nums ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(subscriber.expiryDate).toLocaleDateString('ar-IQ')}</p></div>
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-4 rounded-2xl`}><p className="text-[10px] text-slate-400 font-black mb-1">المبلغ الشهري</p><p className="font-black text-emerald-500 tabular-nums">{subscriber.subscriptionAmount.toLocaleString()} د.ع</p></div>
            <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-4 rounded-2xl`}><p className="text-[10px] text-slate-400 font-black mb-1">الحالة</p><p className={`font-black ${subscriber.isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>{subscriber.isPaid ? 'مسدد' : 'غير مسدد'}</p></div>
          </div>
          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} p-4 rounded-2xl mt-4`}><p className="text-[10px] text-slate-400 font-black mb-1">ملاحظات</p><p className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{subscriber.notes || 'لا توجد ملاحظات'}</p></div>
          <button onClick={onClose} className={`w-full ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'} text-white py-4 rounded-2xl font-black mt-4 shadow-lg active:scale-95 transition-all`}>إغلاق</button>
        </div>
      </div>
    </div>
  );

  const DevContactModal = () => (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white'} w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border`}>
        <div className="p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-600 rounded-[32px] flex items-center justify-center mx-auto shadow-xl rotate-6 mb-4">
            <Sparkles className="text-white w-12 h-12" />
          </div>
          <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>للتواصل مع المبرمج</h2>
          <p className="text-slate-500 font-bold px-4">أهلاً بك! يمكنك التواصل معي عبر الوسائل التالية للحصول على الدعم أو طلب ميزات جديدة.</p>
          
          <div className="grid grid-cols-1 gap-4 mt-8">
            <a 
              href="https://wa.me/9647709938538" 
              target="_blank" 
              className="flex items-center justify-center gap-3 bg-emerald-500 text-white py-5 rounded-3xl font-black text-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <MessageCircle size={28} />
              واتساب
            </a>
            <a 
              href="https://www.facebook.com/share/1D6tgv3vXw/" 
              target="_blank" 
              className="flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-3xl font-black text-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Facebook size={28} />
              فيسبوك
            </a>
          </div>

          <button 
            onClick={() => setShowDevModal(false)}
            className={`w-full py-4 mt-4 rounded-2xl font-black ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} transition-all`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'login') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-900'} p-6 text-right`} dir="rtl">
        <div className={`${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'} w-full max-w-md rounded-[40px] p-10 shadow-2xl text-center`}>
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3"><Users className="text-white w-10 h-10" /></div>
          <h1 className={`text-2xl font-black mb-4 font-tajawal ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>مكتب المؤمن نت</h1>
          {loginError && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl font-bold mb-4 border border-rose-200 animate-shake">
              {failedAttempts >= 2 ? "لا تلح🙄 كلمة المرور خاطئة" : "كلمة المرور غير صحيحة"}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="كلمة المرور" className={`w-full px-6 py-4 rounded-2xl text-center text-xl font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 focus:border-emerald-500 border-2'}`} value={password} onChange={(e) => { setPassword(e.target.value); if(loginError) setLoginError(false); }} autoFocus />
            <button className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all">تسجيل الدخول</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'invoice' && selectedSubForInvoice) {
    const sub = selectedSubForInvoice;
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} p-4 md:p-12 text-right font-tajawal transition-colors duration-300`} dir="rtl">
        <div className={`max-w-2xl mx-auto rounded-[2.5rem] shadow-2xl overflow-hidden relative p-8 print:p-6 print:shadow-none print:border-slate-300 print:rounded-none ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
          <header className="text-center mb-8">
            <div className="flex justify-center items-center gap-5 mb-4">
                <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 p-3.5 rounded-[1.2rem] shadow-lg text-white">
                    <Globe size={36} />
                </div>
                <h1 className={`text-3xl md:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>مكتب المؤمن نت لخدمات الإنترنت</h1>
                <div className="bg-gradient-to-tr from-indigo-600 to-purple-500 p-3.5 rounded-[1.2rem] shadow-lg text-white">
                    <Router size={36} />
                </div>
            </div>
          </header>
          <div className={`h-[3px] w-full rounded-full mb-10 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
                <span className="text-slate-500 font-black whitespace-nowrap text-lg">اسم المشترك :</span>
                <span className={`text-2xl md:text-3xl font-black border-b-4 flex-1 pb-1 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'}`}>{sub.name}</span>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-slate-500 font-black whitespace-nowrap text-lg">فئة الباقة :</span>
                <span className={`text-3xl font-black text-blue-500 border-b-4 flex-1 pb-1 tabular-nums ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    {sub.subscriptionAmount.toLocaleString()} د.ع
                </span>
            </div>
            <div className="grid grid-cols-2 gap-6 my-10">
                <div className={`${isDarkMode ? 'bg-emerald-900/30 border-emerald-900' : 'bg-emerald-100 border-emerald-200'} border-4 p-5 rounded-3xl text-center shadow-inner`}>
                    <p className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'} font-black text-sm mb-2`}>تاريخ التفعيل</p>
                    <p className={`${isDarkMode ? 'text-emerald-100' : 'text-emerald-900'} font-black text-xl tabular-nums`}>
                        {new Date(sub.activationDate).toLocaleDateString('ar-IQ')}
                    </p>
                </div>
                <div className={`${isDarkMode ? 'bg-rose-900/30 border-rose-900' : 'bg-rose-100 border-rose-200'} border-4 p-5 rounded-3xl text-center shadow-inner`}>
                    <p className={`${isDarkMode ? 'text-rose-400' : 'text-rose-700'} font-black text-sm mb-2`}>تاريخ الانتهاء</p>
                    <p className={`${isDarkMode ? 'text-rose-100' : 'text-rose-900'} font-black text-xl tabular-nums`}>
                        {new Date(sub.expiryDate).toLocaleDateString('ar-IQ')}
                    </p>
                </div>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-[1.5rem] border-2 shadow-sm max-w-sm mx-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-slate-500 font-black text-sm md:text-md">المبلغ المدفوع :</span>
                <span className={`text-xl md:text-2xl font-black flex-1 text-left tabular-nums ${sub.isPaid ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {sub.isPaid ? `${sub.subscriptionAmount.toLocaleString()} د.ع (مسدد)` : `مطلوب ${sub.subscriptionAmount.toLocaleString()} د.ع`}
                </span>
            </div>
          </div>
          <footer className={`mt-12 pt-8 border-t-2 border-dashed ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-right">
                <div className="flex items-start gap-3">
                    <MapPin size={24} className="text-emerald-500 mt-1 shrink-0" />
                    <div><p className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>الموقع</p><p className="text-slate-500 font-bold text-sm leading-relaxed">حي سومر داخل فرع صيدلة مروة مقابل مدرسة موسى الكاظم</p></div>
                </div>
                <div className="flex items-start gap-3">
                    <Phone size={24} className="text-blue-500 mt-1 shrink-0" />
                    <div>
                        <p className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>أرقام الصيانة والتفعيل</p>
                        <p className="text-slate-500 font-bold text-sm tabular-nums">صيانة: 07517818413 & 07741119959</p>
                        <p className="text-slate-500 font-bold text-sm tabular-nums">تفعيل: 07710010337 & 07502379869</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                    <Wallet size={24} className="text-amber-500 mt-1 shrink-0" />
                    <div className="w-full"><p className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>الحسابات المالية</p><p className="text-slate-500 font-bold text-sm tabular-nums">ماستر: 7117490289 | زين كاش: 07502379869</p></div>
                </div>
             </div>
          </footer>
        </div>
        <div className="max-w-2xl mx-auto mt-8 flex gap-4 no-print">
          <button onClick={() => window.print()} className="flex-1 bg-emerald-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"><Printer size={24} /> طباعة الوصل</button>
          <button onClick={() => setView('subscribers')} className={`flex-1 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'} py-5 rounded-3xl font-black text-xl transition-all`}>إغلاق</button>
        </div>
      </div>
    );
  }

  const handleSearchFocus = () => setIsSearching(true);
  const handleSearchBlur = (query: string) => {
    if (query === '') setIsSearching(false);
  };

  return (
    <div 
      className={`min-h-screen pb-28 lg:pb-0 ${!isSearching ? 'lg:pr-64' : ''} text-right font-tajawal transition-all duration-300 overflow-x-hidden ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#F8FAFC] text-slate-900'}`} 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!isSearching && (
        <aside className={`hidden lg:flex flex-col fixed right-0 top-0 bottom-0 w-64 border-l p-8 z-50 animate-in slide-in-from-right duration-300 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-10"><div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg"><Users size={24} /></div><h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>المؤمن نت</h2></div>
          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
              { id: 'subscribers', label: 'إدارة المشتركين', icon: Users },
              { id: 'full-list', label: 'القائمة الكاملة', icon: List },
              { id: 'renewal', label: 'تجديد اشتراك', icon: RefreshCcw },
              { id: 'unpaid', label: 'سجل الديون', icon: AlertCircle },
              { id: 'add-subscriber', label: 'إضافة جديد', icon: PlusCircle },
            ].map((item) => (
              <button key={item.id} onClick={() => { setView(item.id as ViewState); setSearchQuery(''); setIsSearching(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-emerald-600 text-white shadow-lg' : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                <item.icon size={20} /><span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={() => setView('login')} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-red-500 hover:bg-red-50/10 mt-auto"><LogOut size={20} /> خروج</button>
        </aside>
      )}

      <main className={`max-w-6xl mx-auto p-5 lg:p-12 transition-all duration-300 ${isSearching ? 'pt-2' : ''}`}>
        {!isSearching && (
          <header className="mb-10 flex flex-col items-center gap-6 relative">
            {/* Title Centered at Top */}
            <h1 className="text-3xl md:text-5xl font-black text-center"><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">مكتب المؤمن نت</span></h1>
            
            {/* Utility Bar - Responsive & Balanced */}
            <div className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-3xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-white border border-slate-100 text-slate-600'}`}>
                
                {/* Right: Designed by Ghazi (Button) - Reduced size */}
                <button 
                  onClick={() => setShowDevModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:bg-slate-100/10 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} shrink-0`}
                >
                  <Sparkles size={16} />
                  <span className="hidden sm:inline text-[9px] font-black uppercase tracking-tight">Designed by Ghazi</span>
                </button>

                {/* Center: The Clock (Icon + Time + Date below) */}
                <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-emerald-500" />
                        <span className="text-base sm:text-xl tabular-nums font-black">{currentTime.toLocaleTimeString('ar-IQ')}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 tabular-nums font-bold mt-0.5">{currentTime.toLocaleDateString('ar-IQ')}</span>
                </div>

                {/* Left: Dark Mode Switch - Balanced layout */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-center leading-none mr-2">
                    <span className={`text-[8px] font-black ${isDarkMode ? 'text-amber-400' : 'text-slate-400'}`}>
                      {isDarkMode ? 'ليلي' : 'نهاري'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-10 h-5 rounded-full relative p-0.5 transition-all flex items-center ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all transform ${isDarkMode ? '-translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>

            </div>
          </header>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button onClick={() => setView('full-list')} className={`p-6 rounded-[32px] shadow-sm flex items-center justify-between transition-all text-right active:scale-95 ${isDarkMode ? 'bg-slate-900 border border-slate-800 hover:border-emerald-800' : 'bg-white border border-slate-100 hover:border-emerald-200'}`}>
                <div><p className="text-slate-400 font-bold mb-1 text-sm">إجمالي المشتركين</p><p className="text-4xl font-black text-emerald-500 tabular-nums">{subscribers.length}</p></div>
                <div className={`${isDarkMode ? 'bg-emerald-900/20' : 'bg-emerald-50'} p-4 rounded-3xl text-emerald-500`}><Users size={32} /></div>
              </button>
              <button onClick={() => setView('unpaid')} className={`p-6 rounded-[32px] shadow-sm flex items-center justify-between transition-all text-right active:scale-95 ${isDarkMode ? 'bg-slate-900 border border-slate-800 hover:border-rose-800' : 'bg-white border border-slate-100 hover:border-rose-200'}`}>
                <div><p className="text-slate-400 font-bold mb-1 text-sm">الديون الكلية</p><p className="text-3xl font-black text-rose-500 tabular-nums">{totalDebt.toLocaleString()}</p></div>
                <div className={`${isDarkMode ? 'bg-rose-900/20' : 'bg-rose-50'} p-4 rounded-3xl text-rose-500`}><DollarSign size={32} /></div>
              </button>
              <button onClick={() => setView('wire-list')} className={`p-6 rounded-[32px] shadow-sm flex items-center justify-between transition-all text-right active:scale-95 ${isDarkMode ? 'bg-slate-900 border border-slate-800 hover:border-blue-800' : 'bg-white border border-slate-100 hover:border-blue-200'}`}>
                <div><p className="text-slate-400 font-bold mb-1 text-sm">سحب واير</p><p className="text-3xl font-black text-blue-500 tabular-nums">{wirePullSubscribers.length}</p></div>
                <div className={`${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'} p-4 rounded-3xl text-blue-500`}><Cable size={32} /></div>
              </button>
              <button onClick={() => setView('tower-list')} className={`p-6 rounded-[32px] shadow-sm flex items-center justify-between transition-all text-right active:scale-95 ${isDarkMode ? 'bg-slate-900 border border-slate-800 hover:border-amber-800' : 'bg-white border border-slate-100 hover:border-amber-200'}`}>
                <div><p className="text-slate-400 font-bold mb-1 text-sm">برج ايجار</p><p className="text-3xl font-black text-amber-500 tabular-nums">{rentedTowerSubscribers.length}</p></div>
                <div className={`${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'} p-4 rounded-3xl text-amber-500`}><Tower size={32} /></div>
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button onClick={() => setView('subscribers')} className={`p-8 rounded-[30px] flex flex-col items-center gap-3 font-black border-2 active:scale-95 transition-all ${isDarkMode ? 'bg-emerald-900/20 border-emerald-900 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}><Users size={32}/><span className="text-lg">إدارة المشتركين</span></button>
              <button onClick={() => setView('add-subscriber')} className={`p-8 rounded-[30px] flex flex-col items-center gap-3 font-black border-2 active:scale-95 transition-all ${isDarkMode ? 'bg-blue-900/20 border-blue-900 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}><PlusCircle size={32}/><span className="text-lg">إضافة جديد</span></button>
              <button onClick={() => setView('full-list')} className={`p-8 rounded-[30px] flex flex-col items-center gap-3 font-black border-2 active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}><List size={32}/><span className="text-lg">القائمة الكاملة</span></button>
              <button onClick={() => setView('renewal')} className={`p-8 rounded-[30px] flex flex-col items-center gap-3 font-black border-2 active:scale-95 transition-all ${isDarkMode ? 'bg-indigo-900/20 border-indigo-900 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}><RefreshCcw size={32}/><span className="text-lg">تجديد</span></button>
            </div>
          </div>
        )}

        {(view === 'wire-list' || view === 'tower-list') && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300">
             <div className={`rounded-[40px] shadow-xl border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${view === 'wire-list' ? (isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDarkMode ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-600')}`}>
                    <div>
                      <h2 className="text-2xl font-black flex items-center gap-3">
                        {view === 'wire-list' ? <Cable size={24}/> : <Tower size={24}/>} 
                        {view === 'wire-list' ? 'مشتركي سحب واير' : 'مشتركي برج ايجار'}
                      </h2>
                      <p className="font-bold opacity-80">{(view === 'wire-list' ? wirePullSubscribers : rentedTowerSubscribers).length} مشترك</p>
                    </div>
                    <button onClick={() => setView('dashboard')} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white/50 hover:bg-white'}`}><X size={24}/></button>
                </div>
                <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {(view === 'wire-list' ? wirePullSubscribers : rentedTowerSubscribers).length === 0 ? (
                    <div className="p-20 text-center text-slate-500 font-black">لا يوجد مشتركين في هذه القائمة</div>
                  ) : (view === 'wire-list' ? wirePullSubscribers : rentedTowerSubscribers).map((s, idx) => (
                    <div key={s.id} className={`p-6 flex justify-between items-center transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-500 tabular-nums">{idx + 1}</span>
                        <div><p className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{s.name}</p><p className="text-slate-500 font-bold text-xs tabular-nums">{s.phone}</p></div>
                      </div>
                      <button onClick={() => setSelectedSubForDetails(s)} className={`px-6 py-2.5 rounded-xl font-black text-sm active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-900 text-white'}`}>التفاصيل</button>
                    </div>
                  ))}
                </div>
             </div>
             <button onClick={() => setView('dashboard')} className={`w-full py-5 rounded-[25px] font-black flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>العودة للرئيسية</button>
          </div>
        )}

        {view === 'subscribers' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300">
            <div className="relative">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="ابحث باسم المشترك..." className={`w-full px-14 py-5 rounded-3xl shadow-sm font-bold text-lg outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-700' : 'bg-white border-slate-100 text-slate-900 focus:border-emerald-400 border'}`} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setIsSearching(e.target.value !== ''); }} onFocus={handleSearchFocus} onBlur={() => handleSearchBlur(searchQuery)} />
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {filteredSubscribersCards.map(s => (
                <div key={s.id} className={`p-6 rounded-[32px] shadow-sm relative group transition-all border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-900' : 'bg-white border-slate-50 hover:border-emerald-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div onClick={() => setSelectedSubForDetails(s)} className="cursor-pointer"><h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{s.name}</h3><p className="text-slate-500 font-bold tabular-nums">{s.phone}</p></div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black ${s.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{s.isPaid ? 'مسدد' : 'دين'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-emerald-950/30 border-emerald-900' : 'bg-emerald-50 border-emerald-100'}`}>
                      <p className={`text-[9px] font-black mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>تفعيل</p>
                      <p className={`text-[10px] font-bold tabular-nums ${isDarkMode ? 'text-emerald-200' : 'text-emerald-700'}`}>{new Date(s.activationDate).toLocaleDateString('ar-IQ')}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-rose-950/30 border-rose-900' : 'bg-rose-50 border-rose-100'}`}>
                      <p className={`text-[9px] font-black mb-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>إنتهاء</p>
                      <p className={`text-[10px] font-bold tabular-nums ${isDarkMode ? 'text-rose-200' : 'text-rose-700'}`}>{new Date(s.expiryDate).toLocaleDateString('ar-IQ')}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-amber-950/30 border-amber-900' : 'bg-amber-50 border-amber-100'}`}>
                      <p className={`text-[9px] font-black mb-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>المتبقي</p>
                      <p className={`text-[10px] font-black tabular-nums leading-tight ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>{getRemainingTime(s.expiryDate)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setSelectedSubForInvoice(s); setView('invoice'); }} className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 shadow-lg' : 'bg-slate-900 text-white'}`}><Printer size={18}/> وصل التفعيل</button>
                    <button onClick={() => confirmDeleteSubscriber(s.id, s.name)} className={`p-4 rounded-2xl transition-all ${isDarkMode ? 'bg-rose-950/30 text-rose-500 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}><Trash2 size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'renewal' && (
          <div className={`p-8 md:p-12 rounded-[40px] shadow-sm max-w-2xl mx-auto animate-in fade-in transition-colors border-2 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-emerald-50'}`}>
            <h2 className="text-2xl font-black mb-8 text-emerald-500 flex items-center gap-2"><RefreshCcw /> تجديد اشتراك</h2>
            <div className="space-y-6">
              <input type="text" placeholder="البحث عن اسم المشترك..." className={`w-full px-5 py-4 rounded-2xl font-bold outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} value={renewalSearchQuery} onChange={e => setRenewalSearchQuery(e.target.value)} />
              <select className={`w-full px-5 py-4 rounded-2xl font-bold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} value={renewForm.subId} onChange={e => {
                  const s = subscribers.find(sub => sub.id === e.target.value);
                  setRenewForm({...renewForm, subId: e.target.value, name: s?.name || '', amount: s?.subscriptionAmount || 35000});
              }}>
                <option value="">-- اختر مشترك --</option>
                {filteredRenewalSubscribers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="space-y-2">
                <label className="font-black text-slate-500 text-sm">مبلغ التجديد</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.slice(0, 5).map(amt => (
                    <button key={amt} onClick={() => setRenewForm({...renewForm, amount: amt, isCustomAmount: false})} className={`py-3 rounded-xl font-bold transition-all ${!renewForm.isCustomAmount && renewForm.amount === amt ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white') : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>{amt.toLocaleString()}</button>
                  ))}
                  <button onClick={() => setRenewForm({...renewForm, isCustomAmount: true})} className={`py-3 rounded-xl font-bold transition-all ${renewForm.isCustomAmount ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white') : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>مبلغ مخصص</button>
                </div>
                {renewForm.isCustomAmount && <input type="number" placeholder="أدخل المبلغ يدوياً..." className={`w-full mt-2 px-5 py-4 rounded-2xl font-bold outline-none animate-in slide-in-from-top-1 border-2 ${isDarkMode ? 'bg-slate-800 border-emerald-900 text-white' : 'bg-slate-50 border-emerald-100'}`} value={renewForm.customAmount} onChange={e => setRenewForm({...renewForm, customAmount: e.target.value})} />}
              </div>
              <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-800'}`}><input type="checkbox" className="w-6 h-6 accent-emerald-600" checked={renewForm.payNow} onChange={e => setRenewForm({...renewForm, payNow: e.target.checked})} /><span className="font-black">تم استلام المبلغ (تجهيز)</span></label>
              <button onClick={renewSubscriber} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">تأكيد التجديد</button>
            </div>
          </div>
        )}

        {view === 'add-subscriber' && (
          <div className={`p-8 md:p-12 rounded-[40px] shadow-sm max-w-3xl mx-auto animate-in slide-in-from-top-5 border-2 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-50'}`}>
            <h2 className="text-2xl font-black mb-8 text-blue-500 flex items-center gap-2"><UserPlus /> إضافة مشترك جديد</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="font-black text-slate-500 text-sm">الاسم الثلاثي</label><input type="text" placeholder="الاسم الكامل" className={`w-full px-5 py-4 rounded-2xl font-bold outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} /></div>
              <div className="space-y-2"><label className="font-black text-slate-500 text-sm">رقم الموبايل</label><input type="tel" placeholder="07XXXXXXXXX" className={`w-full px-5 py-4 rounded-2xl font-bold outline-none border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} value={newSub.phone} onChange={e => setNewSub({...newSub, phone: e.target.value})} /></div>
              <div className="space-y-2 md:col-span-2"><label className="font-black text-slate-500 text-sm">ملاحظات</label><textarea placeholder="سحب واير / برج ايجار ..." className={`w-full px-5 py-4 rounded-2xl font-bold outline-none min-h-[80px] border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`} value={newSub.notes} onChange={e => setNewSub({...newSub, notes: e.target.value})} /></div>
              <div className="space-y-2 md:col-span-2">
                <label className="font-black text-slate-500 text-sm">مبلغ الاشتراك</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map(amt => (
                    <button key={amt} onClick={() => setNewSub({...newSub, amount: amt, isCustomAmount: false})} className={`py-4 rounded-xl font-bold transition-all ${!newSub.isCustomAmount && newSub.amount === amt ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>{amt.toLocaleString()}</button>
                  ))}
                  <button onClick={() => setNewSub({...newSub, isCustomAmount: true})} className={`py-4 rounded-xl font-bold transition-all ${newSub.isCustomAmount ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}>مبلغ مخصص</button>
                </div>
                {newSub.isCustomAmount && <input type="number" placeholder="أدخل المبلغ يدوياً..." className={`w-full mt-3 px-5 py-4 rounded-2xl font-bold outline-none animate-in slide-in-from-top-1 border-2 ${isDarkMode ? 'bg-slate-800 border-blue-900 text-white' : 'bg-slate-50 border-blue-100'}`} value={newSub.customAmount} onChange={e => setNewSub({...newSub, customAmount: e.target.value})} />}
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-800'}`}><input type="checkbox" className="w-6 h-6 accent-blue-600" checked={newSub.payNow} onChange={e => setNewSub({...newSub, payNow: e.target.checked})} /><span className="font-black">تم استلام المبلغ (حفظ)</span></label>
              <button onClick={addSubscriber} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">حفظ المشترك</button>
            </div>
          </div>
        )}

        {view === 'full-list' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300">
             <div className="relative"><Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="ابحث باسم المشترك..." className={`w-full px-14 py-5 rounded-3xl shadow-sm font-bold text-lg outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-700' : 'bg-white border-slate-100 text-slate-900 focus:border-emerald-400 border'}`} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setIsSearching(e.target.value !== ''); }} onFocus={handleSearchFocus} onBlur={() => handleSearchBlur(searchQuery)} /></div>
             <div className={`rounded-[40px] shadow-xl border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}><div><h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>القائمة الكاملة</h2><p className="text-slate-500 font-bold">{filteredFullListSubscribers.length} مشترك</p></div></div>
                <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {filteredFullListSubscribers.map((s, idx) => (
                    <div key={s.id} className={`p-6 flex justify-between items-center transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-4"><span className="font-black text-slate-500 tabular-nums">{idx+1}</span><div><p className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{s.name}</p><p className="text-slate-500 font-bold text-xs tabular-nums">{s.phone}</p></div></div>
                      <div className="flex items-center gap-2"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${s.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{s.isPaid ? 'مسدد' : 'دين'}</span><button onClick={() => setSelectedSubForDetails(s)} className={`p-2 rounded-xl text-slate-500 transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}><Info size={20}/></button></div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {view === 'unpaid' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5">
            <div className={`p-8 rounded-[40px] text-white flex justify-between items-center shadow-xl transition-colors ${isDarkMode ? 'bg-rose-900/40 border border-rose-900' : 'bg-rose-600'}`}><div><h2 className="text-2xl font-black">الديون المستحقة</h2><p className="font-bold opacity-80">إجمالي المبالغ غير المحصلة</p></div><div className="text-4xl font-black tabular-nums">{totalDebt.toLocaleString()} د.ع</div></div>
            <div className="grid gap-6">
              {filteredUnpaidSubscribers.length === 0 ? (
                <div className={`p-12 text-center font-black rounded-[30px] border-2 border-dashed ${isDarkMode ? 'border-slate-800 text-slate-700' : 'border-slate-200 text-slate-300'}`}>لا توجد ديون حالياً، الكل مسدد ✅</div>
              ) : filteredUnpaidSubscribers.map(s => (
                <div key={s.id} className={`p-6 rounded-[32px] border-2 shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-rose-50'}`}>
                  <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{s.name}</h3>
                  <div className="mt-4 space-y-3">
                    {(s.debtHistory || []).filter(d => !d.isPaid).map(d => (
                      <div key={d.id} className={`flex justify-between items-center p-4 rounded-2xl transition-colors ${isDarkMode ? 'bg-rose-900/20' : 'bg-rose-50'}`}>
                        <div><p className={`text-xs font-black ${isDarkMode ? 'text-rose-400' : 'text-rose-400'}`}>تاريخ الدين: {new Date(d.createdAt).toLocaleDateString('ar-IQ')}</p><p className={`font-black tabular-nums ${isDarkMode ? 'text-rose-300' : 'text-rose-700'}`}>{d.amount.toLocaleString()} د.ع</p></div>
                        <button onClick={() => settleDebt(s.id, d.id)} className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black hover:bg-rose-700 active:scale-95 transition-all">تسديد</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {!isSearching && view !== 'login' && view !== 'invoice' && view !== 'add-subscriber' && (
        <button 
          onClick={() => setView('add-subscriber')}
          className="fixed bottom-28 right-6 z-[110] lg:right-12 lg:bottom-12 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all duration-300 animate-pulse-button"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {selectedSubForDetails && <DetailsModal subscriber={selectedSubForDetails} onClose={() => setSelectedSubForDetails(null)} />}
      
      {/* Dev Contact Modal */}
      {showDevModal && <DevContactModal />}

      {!isSearching && view !== 'login' && view !== 'invoice' && (
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 border-t px-6 py-4 flex justify-between items-center z-[100] rounded-t-[35px] shadow-lg no-print transition-colors ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'} backdrop-blur-xl`}>
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'subscribers', icon: Users },
            { id: 'add-subscriber', icon: UserPlus },
            { id: 'renewal', icon: RefreshCcw },
            { id: 'unpaid', icon: AlertCircle },
          ].map(item => (
            <button key={item.id} onClick={() => { setView(item.id as ViewState); setSearchQuery(''); setIsSearching(false); }} className={`p-4 rounded-2xl transition-all duration-300 ${view === item.id ? 'bg-emerald-600 text-white -translate-y-6 shadow-2xl scale-110' : (isDarkMode ? 'text-slate-600' : 'text-slate-400')}`}>
              <item.icon size={26} />
            </button>
          ))}
        </nav>
      )}
      
      <style>{`
        .font-tajawal { font-family: 'Tajawal', sans-serif; }
        @keyframes pulse-button { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .animate-pulse-button { animation: pulse-button 2s infinite ease-in-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        @media print { body { background: white !important; } .no-print { display: none !important; } }
      `}</style>
    </div>
  );
};

export default App;