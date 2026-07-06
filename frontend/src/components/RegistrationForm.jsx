import { useMemo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
void motion;
import { User, Phone, CreditCard, MapPin, ShieldCheck, Mail, WifiOff, Star, MessageSquare } from "lucide-react";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useSync } from "../contexts/SyncContext";
import LanguageToggle from "./LanguageToggle";



const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  secondName: z.string().min(2, "Second name"),
  lastName: z.string().optional(),
  phone: z.string().regex(/^\+254\d{9}$/, "Use format +2547XXXXXXXX"),
  nationalId: z.string().min(7, "Valid ID number is required"),
  yob: z.string().regex(/^(19|20)\d{2}$/, "Enter a valid 4-digit year").refine((year) => {
    const age = new Date().getFullYear() - parseInt(year);
    return age >= 18;
  }, "You must be 18+ to join"),
  ward: z.string().min(3, "Ward is required"),
  pollingCenter: z.string().min(3, "Polling center is required"),
  consent: z.boolean().refine((val) => val === true, "You must consent to join"),
});

export default function RegistrationForm({ referrerId, inviteToken, onSuccess, isAdmin, initialData, selectedVoter }) {
  const { wardsWithCenters } = useLocationData();
  const { t } = useLanguage();
  const { enqueueOffline, isOnline } = useSync();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "+254",
      consent: false,
      ...initialData,
    }
  });

  const consentChecked = watch("consent");
  const selectedWard = watch("ward");

  // Pre-fill form fields when initialData changes (voter lookup selection)
  useEffect(() => {
    if (!initialData) return;
    Object.entries(initialData).forEach(([key, val]) => {
      if (val) setValue(key, val, { shouldValidate: false });
    });
  }, [initialData, setValue]);

  const currentCenters = useMemo(() => {
    const matched = wardsWithCenters.find((ward) => ward.name === selectedWard);
    return matched ? matched.centers : [];
  }, [selectedWard]);



  const onSubmit = async (data) => {
    // ─── Validation against Voter Register ──────────────────────────────────
    if (selectedVoter) {
      // 1. ID Validation
      if (selectedVoter.id_number) {
        const enteredId = data.nationalId.trim();
        const maskedId = selectedVoter.id_number.trim();
        
        if (enteredId.length >= 2 && maskedId.length >= 2) {
          if (enteredId[0] !== maskedId[0] || enteredId[enteredId.length - 1] !== maskedId[maskedId.length - 1]) {
            toast.error("Re-check your information, you made an error.");
            return;
          }
        }
      }

      // 2. Year of Birth Validation
      if (selectedVoter.dob) {
         const enteredYob = data.yob.trim();
         // If the DOB string doesn't contain the entered year anywhere, it's wrong
         if (!selectedVoter.dob.includes(enteredYob)) {
            toast.error("Re-check your information, you made an error.");
            return;
         }
      }
    }

    try {
      const fullName = [data.firstName, data.secondName, data.lastName]
        .filter(Boolean)
        .join(" ");

      const memberPayload = {
        full_name: fullName,
        phone: data.phone,
        national_id: data.nationalId,
        yob: parseInt(data.yob),
        ward: data.ward,
        polling_station: data.pollingCenter,
        referred_by: referrerId || null
      };

      const { data: res, error } = await api.register(memberPayload, inviteToken);

      if (error) {
        throw new Error(error.error || error.message || "Registration failed.");
      }

      // ─── Offline: save to queue, notify user ──────────────────────────────
      if (res?.offline) {
        enqueueOffline({ ...memberPayload, invite_token: inviteToken });
        toast.success(
          `📶 Saved Offline — ${fullName} will sync when internet returns!`,
          { duration: 5000 }
        );
        // Still call onSuccess with a synthetic member object so the UI advances
        onSuccess({ member: memberPayload, token: null, offline: true });
        return;
      }

      toast.success("Registration Successful!");
      onSuccess(res);
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="max-w-xl mx-auto relative z-30"
    >
      <div className="card-official p-8 md:p-10 border-t-8 border-t-dcp-green shadow-xl">
        <header className="flex flex-col items-center mb-10 text-center relative">
          <div className="absolute top-0 right-0">
            <LanguageToggle />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-dcp-green mb-4">
             <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('reg_enrollment')}</h2>
          <p className="text-slate-500 font-medium text-sm">{t('reg_enrollment_desc')}</p>
          {!isOnline && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                {t('reg_offline')}
              </p>
            </div>
          )}
          {initialData && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-dcp-green/10 border border-dcp-green/20 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-dcp-green shrink-0" />
              <p className="text-[10px] font-black text-dcp-green uppercase tracking-widest">
                {t('reg_prefilled')}
              </p>
            </div>
          )}
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-4">
            <h3 className="label-official border-b border-slate-100 pb-2 mb-4">{t('reg_identity')}</h3>
            
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("firstName")}
                    className={`input-official pl-12 ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : ''}`}
                    placeholder={t('first_name')}
                    readOnly={!!selectedVoter}
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.firstName.message}</p>}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("secondName")}
                    className={`input-official pl-12 ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : ''}`}
                    placeholder={t('second_name')}
                    readOnly={!!selectedVoter}
                  />
                  {errors.secondName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.secondName.message}</p>}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("lastName")}
                    className="input-official pl-12"
                    placeholder={t('last_name')}
                  />
                </div>
              </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("phone")}
                  className="input-official pl-12"
                  placeholder={t('phone')}
                />
                {errors.phone && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.phone.message}</p>}
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("nationalId")}
                  className="input-official pl-12"
                  placeholder={t('national_id')}
                />
                {errors.nationalId && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.nationalId.message}</p>}
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("yob")}
                  className="input-official pl-12"
                  placeholder={t('yob')}
                />
                {errors.yob && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.yob.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-2">
            <h3 className="label-official border-b border-slate-100 pb-2 mb-4">{t('reg_location')}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <select
                  {...register("ward")}
                  className={`input-official pl-12 appearance-none ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : 'bg-transparent'}`}
                  defaultValue=""
                  tabIndex={selectedVoter ? -1 : 0}
                >
                  <option value="" disabled>
                    {t('select_ward')}
                  </option>
                  {wardsWithCenters.map((ward) => (
                    <option key={ward.id} value={ward.name}>
                      {ward.label}
                    </option>
                  ))}
                </select>
                {errors.ward && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.ward.message}</p>}
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <select
                  {...register("pollingCenter")}
                  className={`input-official pl-12 appearance-none ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : 'bg-transparent'}`}
                  disabled={!currentCenters.length}
                  defaultValue=""
                  tabIndex={selectedVoter ? -1 : 0}
                >
                  <option value="" disabled>
                    {currentCenters.length ? t('select_center') : t('select_ward_first')}
                  </option>
                  {currentCenters.map((center) => (
                    <option key={center} value={center}>
                      {center}
                    </option>
                  ))}
                </select>
                {errors.pollingCenter && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.pollingCenter.message}</p>}
              </div>
            </div>
          </section>



          <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl mt-6">
            <input
              type="checkbox"
              {...register("consent")}
              id="consent"
              className="mt-1 w-5 h-5 accent-dcp-green cursor-pointer"
            />
            <label htmlFor="consent" className="text-[11px] leading-relaxed text-slate-600 cursor-pointer select-none">
              {t('consent_text')}
            </label>
          </div>
          {errors.consent && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.consent.message}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-3 active:bg-dcp-green-dark"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {t('verifying')}
              </span>
            ) : t('btn_register')}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
