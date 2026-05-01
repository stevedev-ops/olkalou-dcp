import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
void motion;
import { User, Phone, CreditCard, MapPin, ShieldCheck, Mail } from "lucide-react";
import { api } from "../lib/api";
import { wardsWithCenters } from "../lib/pollingCenters";

const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  secondName: z.string().min(2, "Second name"),
  lastName: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
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

export default function RegistrationForm({ referrerId, inviteToken, onSuccess, isAdmin }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "+254",
      consent: false,
      email: "",
    }
  });
  const selectedWard = watch("ward");
  const currentCenters = useMemo(() => {
    const matched = wardsWithCenters.find((ward) => ward.name === selectedWard);
    return matched ? matched.centers : [];
  }, [selectedWard]);

  const onSubmit = async (data) => {
    try {
      const fullName = [data.firstName, data.secondName, data.lastName]
        .filter(Boolean)
        .join(" ");

      const memberPayload = {
        full_name: fullName,
        phone: data.phone,
        national_id: data.nationalId,
        email: data.email,
        yob: parseInt(data.yob),
        ward: data.ward,
        polling_station: data.pollingCenter,
        referred_by: referrerId || null
      };

      const { data: res, error } = await api.register(memberPayload, inviteToken);

      if (error) {
        throw new Error(error.error || error.message || "Registration failed.");
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
        <header className="flex flex-col items-center mb-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-dcp-green mb-4">
             <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Member Enrollment</h2>
          <p className="text-slate-500 font-medium text-sm">Official membership registration for Democracy for Citizens Party.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-4">
            <h3 className="label-official border-b border-slate-100 pb-2 mb-4">A. Identity Information</h3>
            
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("firstName")}
                    className="input-official pl-12"
                    placeholder="First Name (As per ID Card)"
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.firstName.message}</p>}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("secondName")}
                    className="input-official pl-12"
                    placeholder="Second Name (As per ID Card)"
                  />
                  {errors.secondName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.secondName.message}</p>}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("lastName")}
                    className="input-official pl-12"
                    placeholder="Last Name (Optional)"
                  />
                </div>
              </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("phone")}
                  className="input-official pl-12"
                  placeholder="+254 7XX ..."
                />
                {errors.phone && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.phone.message}</p>}
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("email")}
                  className="input-official pl-12"
                  placeholder="Email Address"
                />
                {errors.email && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.email.message}</p>}
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("nationalId")}
                  className="input-official pl-12"
                  placeholder="National ID Number"
                />
                {errors.nationalId && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.nationalId.message}</p>}
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("yob")}
                  className="input-official pl-12"
                  placeholder="Year of Birth (YYYY)"
                />
                {errors.yob && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.yob.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-2">
            <h3 className="label-official border-b border-slate-100 pb-2 mb-4">B. Location & Polling</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <select
                  {...register("ward")}
                  className="input-official pl-12 bg-transparent appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select ward
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
                  className="input-official pl-12 bg-transparent appearance-none"
                  disabled={!currentCenters.length}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {currentCenters.length ? "Select polling center" : "Select ward first"}
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
              I confirm I wish to be a member of the <span className="text-slate-900 font-bold">Democracy for Citizens Party (DCP)</span> and authorize Hon. Said Karani's team to contact me regarding official party activities and mobilization.
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
                Verifying Credentials...
              </span>
            ) : "Join DCP — Register Now"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
