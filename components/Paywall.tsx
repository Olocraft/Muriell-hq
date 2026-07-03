
import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Zap, Crown, Ghost, Check, X, Loader2, Star, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { auth } from '../services/firebase';
import { taskService } from '../services/taskService';

interface PaywallProps {
  onClose: () => void;
  onSuccess: () => void;
}

const Paywall: React.FC<PaywallProps> = ({ onClose, onSuccess }) => {
  const [purchasing, setPurchasing] = useState(false);
  
  // Paystack Configuration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: auth.currentUser?.email || "raphaelbinitiejr@gmail.com",
    amount: 500000, // 5000 NGN in kobo
    publicKey: 'pk_test_fc8adf24fe31c56a330acdad1864fad5e08156d1',
    metadata: {
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: auth.currentUser?.uid || 'unknown'
        },
        {
          display_name: "Destination Account",
          variable_name: "destination",
          value: "9015383694 Opay - Binitie Enaholo Raphael"
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccessPayment = (reference: any) => {
    // Save locally or remote that the user is a pro user. In a real app we'd verify the trans reference via our backend!
    console.log("Payment successful", reference);
    setPurchasing(false);
    onSuccess(); // Grants Pro Access locally
  };

  const onClosePayment = () => {
    console.log("Payment dialog closed.");
    setPurchasing(false);
  };

  const handlePurchase = () => {
    setPurchasing(true);
    initializePayment({onSuccess: onSuccessPayment, onClose: onClosePayment});
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
          
            <div className="w-full space-y-6">
              <div className="space-y-4">
                  <button 
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className={`w-full p-6 glass border-2 rounded-3xl flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-95 border-emerald-500/30 hover:border-[#EF216A]/50`}
                  >
                    <div className="text-left">
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#EF216A] mb-1">
                         LIFETIME ACCESS
                      </div>
                      <div className="text-xl font-black italic uppercase text-white tracking-tight">
                        Muriell Pro (Paystack)
                      </div>
                      <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
                        Transfers to Opay: 9015383694
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black italic text-white tracking-tighter">
                        ₦5,000
                      </div>
                      {purchasing ? (
                        <Loader2 className="w-4 h-4 text-[#EF216A] animate-spin ml-auto" />
                      ) : (
                        <div className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">
                          Proceed to Pay
                        </div>
                      )}
                    </div>
                  </button>
              </div>
              
              <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest text-center mt-6">
                Secure transaction via Paystack. Funds sent to Binitie Enaholo Raphael.
              </p>
            </div>
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
