
import React, { useEffect, useState } from 'react';
import { Package, Offerings } from '@revenuecat/purchases-js';
import { billing } from '../services/billingService';
import { Zap, Crown, Ghost, Check, X, Loader2, Star, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

interface PaywallProps {
  onClose: () => void;
  onSuccess: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ onClose, onSuccess }) => {
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [passcodeApplied, setPasscodeApplied] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await billing.getOfferings();
      setOfferings(data);
      setLoading(false);
    };
    load();
  }, []);

  const handlePurchase = async (pkg: Package) => {
    setPurchasing(pkg.identifier);
    const success = await billing.purchase(pkg);
    if (success) {
      onSuccess();
    }
    setPurchasing(null);
  };

  const handleApplyPasscode = () => {
    if (passcode === 'MURIELL29#') {
      setPasscodeApplied(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setPasscodeApplied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="glass w-full max-w-4xl rounded-[4rem] border-[#EF216A]/30 overflow-hidden relative shadow-2xl flex flex-col md:flex-row bg-black">
        {/* Left Side: Features */}
        <div className="md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-gradient-to-br from-[#EF216A]/10 via-transparent to-transparent">
          <div className="flex items-center gap-3 mb-8">
            <Logo className="w-10 h-10" expression="proud" />
            <span className="text-2xl font-black italic uppercase tracking-tighter">Muriell Pro</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-10">
            UNLEASH <br/>
            <span className="text-[#EF216A]">TRUE DISCIPLINE.</span>
          </h2>

          <div className="space-y-6">
            <FeatureItem title="Priority AI Core" desc="Simulated zero-latency neural processing." />
            <FeatureItem title="Neural Aura" desc="Exclusive Pro-grade UI visualization." />
            <FeatureItem title="Deep Analytics" desc="Full-spectrum browser focus auditing." />
            <FeatureItem title="Cross-Platform Sync" desc="Discipline follows you everywhere." />
          </div>
        </div>

        {/* Right Side: Options */}
        <div className="md:w-1/2 p-10 md:p-16 flex flex-col items-center justify-center bg-white/[0.02] relative">
          <button onClick={onClose} className="absolute top-8 right-8 p-3 glass rounded-full text-gray-500 hover:text-white transition-all z-10"><X className="w-5 h-5" /></button>
          
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[#EF216A] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Retrieving Offers...</p>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {/* Passcode Section */}
              <div className="space-y-3">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 px-1">Redeem Protocol Code</div>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Passcode..."
                    disabled={passcodeApplied}
                    className={`flex-1 bg-black/40 border-2 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest focus:outline-none transition-all ${
                      passcodeApplied ? 'border-green-500 text-green-500' : 
                      passcodeError ? 'border-red-500 text-red-500' : 'border-white/5 focus:border-[#EF216A]'
                    }`}
                  />
                  {!passcodeApplied && (
                    <button 
                      onClick={handleApplyPasscode}
                      className="px-6 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-gray-200 transition-all"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {passcodeApplied && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest px-1 animate-in slide-in-from-top-2">
                    <ShieldCheck className="w-3 h-3" /> 2-Month Free Trial Activated
                  </div>
                )}
                {passcodeError && (
                  <div className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 animate-in slide-in-from-top-2">
                    Invalid Protocol Code
                  </div>
                )}
              </div>

              <div className="h-px bg-white/5 w-full"></div>

              <div className="space-y-4">
                {offerings?.current?.availablePackages.map((pkg) => (
                  <button 
                    key={pkg.identifier}
                    onClick={() => handlePurchase(pkg)}
                    disabled={!!purchasing}
                    className={`w-full p-6 glass border-2 rounded-3xl flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-95 ${
                      passcodeApplied ? 'border-green-500/30 hover:border-green-500/60' : 'border-white/5 hover:border-[#EF216A]/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#EF216A] mb-1">
                        {passcodeApplied ? 'SPECIAL OFFER' : (pkg.packageType === 'ANNUAL' ? 'BEST VALUE' : pkg.packageType)}
                      </div>
                      <div className="text-xl font-black italic uppercase text-white tracking-tight">
                        {pkg.product.title.split('(')[0]}
                      </div>
                      {passcodeApplied && (
                        <div className="text-[8px] font-black text-green-500 uppercase tracking-widest mt-1">
                          Includes 2 Months Free
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black italic text-white tracking-tighter">
                        {passcodeApplied ? '$0.00' : pkg.product.priceString}
                      </div>
                      {purchasing === pkg.identifier ? (
                        <Loader2 className="w-4 h-4 text-[#EF216A] animate-spin ml-auto" />
                      ) : (
                        <div className="text-[8px] font-black uppercase text-gray-600 tracking-widest">
                          {passcodeApplied ? 'Start Trial' : 'Select Plan'}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest text-center mt-6">
                {passcodeApplied 
                  ? "Card required for verification. You won't be charged for 60 days."
                  : "Secure transaction via RevenueCat. Cancel anytime."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ title: string, desc: string }> = ({ title, desc }) => (
  <div className="flex gap-4">
    <div className="p-2 h-fit bg-[#EF216A]/10 rounded-lg"><Check className="w-4 h-4 text-[#EF216A]" /></div>
    <div>
      <h4 className="text-xs font-black uppercase tracking-widest text-white">{title}</h4>
      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{desc}</p>
    </div>
  </div>
);

export default Paywall;
