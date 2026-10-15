import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Trophy, 
  CreditCard, 
  Smartphone, 
  RotateCcw,
  CheckCircle2,
  Lock,
  ArrowRight,
  Copy,
  ExternalLink,
  QrCode,
  Info,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlanTier, UserProfile } from '../types';
import { 
  PLAN_CONFIGS, 
  getUserPlan, 
  createDemoSubscription, 
  createSubscriptionWithPayment, 
  createSubscriptionWithRazorpay,
  FAMPAY_UPI_ID 
} from '../utils/plans';
import { saveUserProfile } from '../utils/storage';
import { 
  getRazorpayConfig, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  loadRazorpayScript, 
  RazorpayConfig 
} from '../utils/razorpay';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PricingModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onPlanUpdated: (updatedUser: UserProfile) => void;
  defaultPlanSelection?: PlanTier;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  user,
  isOpen,
  onClose,
  onPlanUpdated,
  defaultPlanSelection,
}) => {
  const currentPlan = getUserPlan(user);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanTier | null>(
    defaultPlanSelection && defaultPlanSelection !== currentPlan ? defaultPlanSelection : null
  );

  // Payment method tab in checkout: 'razorpay' (Primary Auto-Activate) vs 'fampay_upi' vs 'sandbox_demo'
  const [checkoutMode, setCheckoutMode] = useState<'razorpay' | 'fampay_upi' | 'sandbox_demo'>('razorpay');
  
  // Custom amount support
  const [customAmount, setCustomAmount] = useState<number>(299);
  const [utrInput, setUtrInput] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  // Razorpay Gateway State
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfig | null>(null);
  const [isScriptReady, setIsScriptReady] = useState<boolean>(false);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  useEffect(() => {
    getRazorpayConfig().then((cfg) => setRazorpayConfig(cfg));
    loadRazorpayScript().then((ready) => setIsScriptReady(ready));
  }, []);

  if (!isOpen) return null;

  const handleStartCheckout = (tier: PlanTier) => {
    if (tier === currentPlan) return;
    if (tier === 'free') {
      handleDowngradeToFree();
      return;
    }
    setSelectedPlanForCheckout(tier);
    const defaultAmount = tier === 'ultra_premium' ? 599 : 299;
    setCustomAmount(defaultAmount);
    setCheckoutMode('razorpay');
    setIsSuccess(false);
    setRazorpayError(null);
    setUtrInput('');
  };

  const handleDowngradeToFree = () => {
    const updatedUser: UserProfile = {
      ...user,
      subscription: createDemoSubscription('free', 'Reset to Free Tier'),
    };
    saveUserProfile(updatedUser);
    onPlanUpdated(updatedUser);
    onClose();
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(FAMPAY_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const planTitle = selectedPlanForCheckout ? PLAN_CONFIGS[selectedPlanForCheckout].name : 'Plan';
  const effectiveAmount = Math.max(1, customAmount || 1);
  const upiIntentUri = `upi://pay?pa=${FAMPAY_UPI_ID}&pn=Focura%20Study&am=${effectiveAmount}&cu=INR&tn=Focura%20${encodeURIComponent(planTitle)}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiIntentUri)}&margin=4`;

  /**
   * Razorpay Checkout Flow: Instant Verification & Automatic Plan Activation
   */
  const handlePayWithRazorpay = async () => {
    if (!selectedPlanForCheckout) return;
    setIsProcessing(true);
    setRazorpayError(null);

    try {
      // 1. Create order on backend server
      const order = await createRazorpayOrder({
        plan: selectedPlanForCheckout,
        amount: effectiveAmount,
        currency: 'INR',
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      });

      // 2. If Razorpay live/test SDK is available and keys are active
      if (window.Razorpay && !order.isSandbox && order.keyId && !order.keyId.includes('placeholder')) {
        const options = {
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Focura Study',
          description: `Activate ${planTitle}`,
          image: '/favicon.svg',
          order_id: order.orderId,
          prefill: {
            name: user.name || 'Student',
            email: user.email || '',
          },
          theme: {
            color: '#f59e0b',
          },
          handler: async function (response: any) {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlanForCheckout,
                amount: effectiveAmount,
                userId: user.id,
                userEmail: user.email,
                userName: user.name,
              });

              completePlanActivation(
                selectedPlanForCheckout,
                effectiveAmount,
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature
              );
            } catch (err: any) {
              setRazorpayError(err.message || 'Payment signature verification failed');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setRazorpayError(resp.error?.description || 'Payment was unsuccessful');
          setIsProcessing(false);
        });
        rzp.open();
        return;
      }

      // 3. Fallback Test Mode (when Razorpay keys are not yet provided in .env)
      // Provides an instant automated test approval so testing works out of the box
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const mockPayId = `pay_test_${Date.now().toString(36)}`;
      
      await verifyRazorpayPayment({
        razorpay_order_id: order.orderId,
        razorpay_payment_id: mockPayId,
        razorpay_signature: 'simulated_test_sig',
        plan: selectedPlanForCheckout,
        amount: effectiveAmount,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      });

      completePlanActivation(
        selectedPlanForCheckout,
        effectiveAmount,
        mockPayId,
        order.orderId
      );
    } catch (err: any) {
      console.error('Razorpay payment error:', err);
      setRazorpayError(err.message || 'Unable to connect to Razorpay. Please verify internet connection.');
      setIsProcessing(false);
    }
  };

  const completePlanActivation = (
    tier: PlanTier,
    amount: number,
    paymentId: string,
    orderId?: string,
    signature?: string
  ) => {
    const updatedUser: UserProfile = {
      ...user,
      subscription: createSubscriptionWithRazorpay(
        tier,
        amount,
        paymentId,
        orderId,
        signature
      ),
    };

    saveUserProfile(updatedUser);
    onPlanUpdated(updatedUser);
    setActivePaymentId(paymentId);
    setIsProcessing(false);
    setIsSuccess(true);

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#fbbf24', '#f59e0b', '#38bdf8', '#10b981'],
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleActivatePlan = async () => {
    if (!selectedPlanForCheckout) return;

    if (checkoutMode === 'razorpay') {
      await handlePayWithRazorpay();
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const updatedUser: UserProfile = {
      ...user,
      subscription: checkoutMode === 'fampay_upi'
        ? createSubscriptionWithPayment(
            selectedPlanForCheckout,
            effectiveAmount,
            `FamPay UPI (${FAMPAY_UPI_ID})`,
            utrInput.trim() || undefined
          )
        : createDemoSubscription(selectedPlanForCheckout, '1-Click Sandbox Test'),
    };

    saveUserProfile(updatedUser);
    onPlanUpdated(updatedUser);

    setIsProcessing(false);
    setIsSuccess(true);

    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#fbbf24', '#f59e0b', '#38bdf8', '#10b981'],
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleFinishSuccess = () => {
    setIsSuccess(false);
    setSelectedPlanForCheckout(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-7 shadow-2xl text-white my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>FamPay UPI Supported · Pay What You Want</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Choose Your Focus Superpower
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Activate extended focus timer detection, advanced computer vision, and the global study leaderboard. Pay any custom amount via FamPay UPI or test in Sandbox demo.
          </p>

          {/* Currency Toggle */}
          <div className="mt-4 inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs font-mono">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1 rounded-md transition-colors ${
                currency === 'INR' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-md transition-colors ${
                currency === 'USD' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* FREE PLAN */}
          <div
            className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all ${
              currentPlan === 'free'
                ? 'border-zinc-500 bg-zinc-900/50 shadow-lg'
                : 'border-zinc-850 bg-zinc-950/70 hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Starter
                </span>
                {currentPlan === 'free' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Active Plan
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Free Tier</h3>
              <p className="text-xs text-zinc-400 mb-4">{PLAN_CONFIGS.free.tagline}</p>

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-zinc-850">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">₹0</span>
                  <span className="text-xs text-zinc-500">/ forever free</span>
                </div>
                {/* Core Limit Highlight */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-300 text-xs font-mono font-bold border border-zinc-800">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Max 45 Min Focus / Day</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-zinc-300 mb-6">
                {PLAN_CONFIGS.free.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
                {PLAN_CONFIGS.free.limitations.map((limit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-500">
                    <Lock className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStartCheckout('free')}
              disabled={currentPlan === 'free'}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                currentPlan === 'free'
                  ? 'bg-zinc-850 text-zinc-500 cursor-default'
                  : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {currentPlan === 'free' ? 'Currently Active' : 'Reset to Free Plan'}
            </button>
          </div>

          {/* PREMIUM PLAN */}
          <div
            className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all ${
              currentPlan === 'premium'
                ? 'border-white bg-zinc-900/70 shadow-xl ring-1 ring-white/20'
                : 'border-zinc-700 bg-zinc-900/30 hover:border-zinc-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Focus Pro
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black">
                  POPULAR
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Premium Tier</h3>
              <p className="text-xs text-zinc-400 mb-4">{PLAN_CONFIGS.premium.tagline}</p>

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-zinc-850">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">
                    {currency === 'INR' ? '₹299' : '$3.99'}
                  </span>
                  <span className="text-xs text-zinc-400">/ suggested</span>
                </div>
                {/* Core Limit Highlight */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-mono font-bold border border-white/20">
                  <Clock className="h-3.5 w-3.5 text-white" />
                  <span>Max 4 Hours Focus / Day</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-zinc-200 mb-6">
                {PLAN_CONFIGS.premium.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
                {PLAN_CONFIGS.premium.limitations.map((limit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-500">
                    <Lock className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStartCheckout('premium')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                currentPlan === 'premium'
                  ? 'bg-zinc-800 text-zinc-400 cursor-default'
                  : 'bg-white text-black hover:bg-zinc-200 font-extrabold shadow-md'
              }`}
            >
              {currentPlan === 'premium' ? (
                'Current Active Plan'
              ) : (
                <>
                  <span>Pay via FamPay / Activate</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* ULTRA PREMIUM PLAN */}
          <div
            className={`relative rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all ${
              currentPlan === 'ultra_premium'
                ? 'border-amber-400 bg-amber-950/20 shadow-2xl ring-2 ring-amber-400/40'
                : 'border-amber-500/40 bg-gradient-to-b from-amber-950/10 to-zinc-950 hover:border-amber-400/80'
            }`}
          >
            {/* Top Ribbon */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 text-black text-[10px] font-mono font-extrabold uppercase shadow-lg flex items-center gap-1">
              <Crown className="h-3 w-3" />
              <span>Full Mastery & Unlimited</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  Ultra Master
                </span>
                {currentPlan === 'ultra_premium' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    Active Plan
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Ultra Premium</h3>
              <p className="text-xs text-zinc-400 mb-4">{PLAN_CONFIGS.ultra_premium.tagline}</p>

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-zinc-850">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-amber-300">
                    {currency === 'INR' ? '₹599' : '$7.99'}
                  </span>
                  <span className="text-xs text-zinc-400">/ suggested</span>
                </div>
                {/* Core Limit Highlight: UNLIMITED */}
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                    <span>UNLIMITED Focus Time Detection</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-200 text-xs font-mono font-bold border border-amber-500/20">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span>Global Leaderboard Unlocked</span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5 text-xs text-zinc-200 mb-6">
                {PLAN_CONFIGS.ultra_premium.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className={feat.includes('UNLIMITED') || feat.includes('Leaderboard') ? 'font-bold text-white' : ''}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleStartCheckout('ultra_premium')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                currentPlan === 'ultra_premium'
                  ? 'bg-zinc-800 text-zinc-400 cursor-default'
                  : 'bg-gradient-to-r from-amber-400 to-amber-300 text-black hover:from-amber-300 hover:to-amber-200 font-extrabold shadow-lg shadow-amber-500/10'
              }`}
            >
              {currentPlan === 'ultra_premium' ? (
                'Current Active Plan'
              ) : (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  <span>Pay via FamPay / Activate Ultra</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CHECKOUT MODAL: FamPay UPI Integration + Custom Amount + Demo Option */}
        {/* ========================================================================= */}
        {selectedPlanForCheckout && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5 sm:p-6 shadow-2xl text-white my-auto">
              {!isSuccess ? (
                <>
                  {/* Checkout Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {checkoutMode === 'razorpay' ? (
                          <CreditCard className="h-5 w-5" />
                        ) : checkoutMode === 'fampay_upi' ? (
                          <Smartphone className="h-5 w-5" />
                        ) : (
                          <Zap className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Activate {PLAN_CONFIGS[selectedPlanForCheckout].name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {checkoutMode === 'razorpay' ? 'Razorpay Auto-Active' : checkoutMode === 'fampay_upi' ? 'FamPay UPI' : 'Free Demo'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          {checkoutMode === 'razorpay'
                            ? 'Instant automatic plan activation via UPI, GPay, PhonePe, Cards, NetBanking.'
                            : checkoutMode === 'fampay_upi'
                            ? 'Pay via FamPay UPI QR or ID with custom amount support.'
                            : 'Test all features in instant sandbox mode with zero payment.'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPlanForCheckout(null)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mode Selector Tabs: Razorpay vs FamPay UPI vs Instant Demo */}
                  <div className="grid grid-cols-3 gap-1.5 mb-4 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                    <button
                      onClick={() => setCheckoutMode('razorpay')}
                      className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                        checkoutMode === 'razorpay'
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Razorpay</span>
                    </button>

                    <button
                      onClick={() => setCheckoutMode('fampay_upi')}
                      className={`py-2 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                        checkoutMode === 'fampay_upi'
                          ? 'bg-white text-black shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>FamPay UPI</span>
                    </button>

                    <button
                      onClick={() => setCheckoutMode('sandbox_demo')}
                      className={`py-2 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                        checkoutMode === 'sandbox_demo'
                          ? 'bg-white text-black font-bold shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Sandbox (₹0)</span>
                    </button>
                  </div>

                  {/* ========================================================= */}
                  {/* 1. RAZORPAY PAYMENT VIEW (PRIMARY AUTOMATED GATEWAY) */}
                  {/* ========================================================= */}
                  {checkoutMode === 'razorpay' && (
                    <div className="space-y-4">
                      {/* Gateway Status Badge */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${razorpayConfig?.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                          <span className="text-zinc-300">
                            {razorpayConfig?.isConfigured
                              ? `Razorpay Gateway Connected (${razorpayConfig.isLive ? 'Live' : 'Test Mode'})`
                              : 'Razorpay Gateway Ready (Sandbox Simulated Test)'}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500">Auto-Activates</span>
                      </div>

                      {/* Error Alert if any */}
                      {razorpayError && (
                        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-start gap-2">
                          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold">Payment Error:</span> {razorpayError}
                          </div>
                        </div>
                      )}

                      {/* Plan & Amount Summary Box */}
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-zinc-900/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Plan Selected</span>
                            <span className="text-base font-extrabold text-white">
                              {PLAN_CONFIGS[selectedPlanForCheckout].name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Total Amount</span>
                            <span className="text-2xl font-black text-amber-300 font-mono">
                              ₹{effectiveAmount}
                            </span>
                          </div>
                        </div>

                        {/* Amount Customizer / Quick Chips */}
                        <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-zinc-400">Payment Amount:</span>
                          <div className="flex items-center gap-1.5">
                            {[29, 99, 199, 299, 599].map((amt) => (
                              <button
                                key={amt}
                                onClick={() => setCustomAmount(amt)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                                  customAmount === amt
                                    ? 'bg-amber-400 text-black font-bold'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                ₹{amt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Supported Payment Channels */}
                        <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800/80 space-y-1.5">
                          <span className="text-[10px] font-mono text-zinc-400 block">Accepted via Razorpay:</span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-200 border border-zinc-700">Google Pay</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-200 border border-zinc-700">PhonePe</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-200 border border-zinc-700">Paytm</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-200 border border-zinc-700">CRED</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-200 border border-zinc-700">Debit / Credit Cards</span>
                            <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-200 border border-zinc-700">NetBanking</span>
                          </div>
                        </div>
                      </div>

                      {/* Information note for receiving funds */}
                      <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-400 flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <span className="text-zinc-200 font-bold">Owner Settlement Notice:</span> Payments made here are collected by Razorpay and settled directly to your registered bank account. When keys are active, plan automatically switches to Ultra or Pro on verified payment.
                        </div>
                      </div>

                      {/* Razorpay Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setSelectedPlanForCheckout(null)}
                          disabled={isProcessing}
                          className="w-1/3 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleActivatePlan}
                          disabled={isProcessing}
                          className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs hover:from-amber-300 hover:to-amber-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Opening Razorpay Gateway...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              <span>Pay ₹{effectiveAmount} with Razorpay</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FAMPAY UPI PAYMENT VIEW */}
                  {checkoutMode === 'fampay_upi' && (
                    <div className="space-y-4">
                      {/* Customer Custom Amount Input (Pay What You Want) */}
                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono uppercase text-zinc-300 font-bold flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Your Payment Amount (₹)</span>
                          </label>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Activates at Any Amount
                          </span>
                        </div>

                        {/* Amount Input with Currency Symbol */}
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-extrabold text-white">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={customAmount}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setCustomAmount(val);
                            }}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-700 bg-black font-mono text-lg font-extrabold text-white focus:outline-none focus:border-amber-400 transition-colors"
                            placeholder="e.g. 299"
                          />
                        </div>

                        {/* Quick Preset Amount Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-zinc-500 font-mono">Quick:</span>
                          {[29, 49, 99, 199, 299, 599].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setCustomAmount(amt)}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all ${
                                customAmount === amt
                                  ? 'bg-amber-400 text-black font-bold'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                              }`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* FamPay UPI Details & Dynamic QR Code Box */}
                      <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-zinc-900/60 space-y-3">
                        {/* FamPay UPI ID Row with Copy Button */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/70 border border-zinc-800">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                              Beneficiary FamPay UPI ID:
                            </span>
                            <span className="font-mono text-sm font-extrabold text-amber-300">
                              {FAMPAY_UPI_ID}
                            </span>
                          </div>

                          <button
                            onClick={handleCopyUpi}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                              copiedUpi
                                ? 'bg-emerald-500 text-black'
                                : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white'
                            }`}
                            title="Copy FamPay UPI ID"
                          >
                            {copiedUpi ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Dynamic QR Code & Direct Mobile Link */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                          {/* Live QR Code image */}
                          <div className="bg-white p-2 rounded-xl shadow-lg border border-zinc-300 shrink-0 text-center">
                            <img
                              src={qrCodeImageUrl}
                              alt={`UPI QR code for ₹${effectiveAmount}`}
                              className="h-32 w-32 object-contain rounded-lg"
                            />
                            <span className="text-[9px] font-mono text-zinc-600 block mt-1">
                              Scan with any UPI App
                            </span>
                          </div>

                          {/* Instructions & Direct Intent Link */}
                          <div className="text-left space-y-2.5 flex-1">
                            <div className="text-xs text-zinc-300 leading-snug">
                              1. Scan QR with <strong className="text-white">FamPay</strong>, <strong className="text-white">GPay</strong>, <strong className="text-white">PhonePe</strong>, or <strong className="text-white">Paytm</strong>.
                            </div>
                            <div className="text-xs text-zinc-300 leading-snug">
                              2. Complete the payment of <strong className="text-amber-300 font-mono">₹{effectiveAmount}</strong>.
                            </div>

                            {/* Direct Mobile UPI Intent Button */}
                            <a
                              href={upiIntentUri}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                              <span>Pay via UPI App (Mobile)</span>
                            </a>
                          </div>
                        </div>

                        {/* Optional UTR / Reference ID Field */}
                        <div className="pt-2 border-t border-zinc-800/80">
                          <label className="text-[11px] text-zinc-400 block mb-1">
                            UPI Transaction Ref / UTR (Optional):
                          </label>
                          <input
                            type="text"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            placeholder="e.g. 429103829104"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-black text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                          />
                        </div>
                      </div>

                      {/* FamPay Confirmation Action Button */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setSelectedPlanForCheckout(null)}
                          disabled={isProcessing}
                          className="w-1/3 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleActivatePlan}
                          disabled={isProcessing}
                          className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 text-black font-extrabold text-xs hover:from-amber-300 hover:to-amber-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Verifying & Activating...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>I Have Paid ₹{effectiveAmount} · Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SANDBOX DEMO VIEW (Free 1-Click Testing) */}
                  {checkoutMode === 'sandbox_demo' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Plan:</span>
                          <span className="font-bold text-white capitalize">
                            {PLAN_CONFIGS[selectedPlanForCheckout].name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Daily Focus Limit:</span>
                          <span className="font-mono font-bold text-amber-300">
                            {selectedPlanForCheckout === 'ultra_premium'
                              ? 'Unlimited'
                              : '4 Hours / Day'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Global Leaderboard:</span>
                          <span className="text-zinc-200">
                            {selectedPlanForCheckout === 'ultra_premium' ? '✅ Unlocked' : '❌ Locked'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline text-sm">
                          <span className="text-zinc-300">Sandbox Cost:</span>
                          <span className="font-mono font-extrabold text-emerald-400">
                            ₹0.00 (Demo Free)
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-zinc-400 flex items-start gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          Immediate activation without any payment. Perfect for testing focus timer limits and leaderboard rankings right now.
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setSelectedPlanForCheckout(null)}
                          disabled={isProcessing}
                          className="w-1/3 py-2.5 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleActivatePlan}
                          disabled={isProcessing}
                          className="w-2/3 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <div className="h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Activating Sandbox...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              <span>1-Click Activate (Free)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* SUCCESS CELEBRATION VIEW */
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">
                      Subscription Activated!
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      You are now on{' '}
                      <span className="font-bold text-white">
                        {PLAN_CONFIGS[selectedPlanForCheckout].name}
                      </span>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-xs text-zinc-300 text-left space-y-1.5 font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Method:</span>
                      <span className="text-zinc-300">
                        {checkoutMode === 'razorpay'
                          ? 'Razorpay Gateway (Auto-Activated)'
                          : checkoutMode === 'fampay_upi'
                          ? `FamPay UPI (${FAMPAY_UPI_ID})`
                          : 'Sandbox Demo'}
                      </span>
                    </div>
                    {activePaymentId && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Payment ID:</span>
                        <span className="text-amber-300 font-mono">{activePaymentId}</span>
                      </div>
                    )}
                    {checkoutMode !== 'sandbox_demo' && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Amount Paid:</span>
                        <span className="text-emerald-400 font-bold">₹{effectiveAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Daily Focus Limit:</span>
                      <span className="text-amber-300 font-bold">
                        {selectedPlanForCheckout === 'ultra_premium'
                          ? 'UNLIMITED'
                          : '4 Hours / Day'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Leaderboard Status:</span>
                      <span className="text-emerald-400 font-bold">
                        {selectedPlanForCheckout === 'ultra_premium' ? 'Unlocked & Active' : 'Locked'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleFinishSuccess}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-colors"
                  >
                    Start Studying with New Tier
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
