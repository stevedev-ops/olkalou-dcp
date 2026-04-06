import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User, CreditCard, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  nationalId: z.string().min(7, "Valid ID number is required"),
});

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (localStorage.getItem("dcp_member_id")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      const { data: users, error } = await supabase
        .from('dcp_members')
        .select('id, full_name, is_admin')
        .eq('national_id', data.nationalId)
        .ilike('full_name', `${data.firstName}%`)
        .limit(1);

      if (error) throw error;
      if (!users || users.length === 0) {
        throw new Error("No member found with that First Name and ID combination.");
      }

      toast.success(`Welcome back, ${users[0].full_name.split(' ')[0]}!`);
      onLogin(users[0].id);
      
      if (users[0].is_admin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast.error(error.message || "Failed to log in.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-3 shadow-xl mb-4">
            <img src={logo} alt="DCP" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dcp-green mb-1">Democracy for Citizens Party</p>
          <h1 className="text-2xl font-black text-white">Member Login</h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={20} className="text-dcp-green" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Identity Verification</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                {...register("firstName")}
                placeholder="First Name (As per ID Card)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-dcp-green transition"
              />
              {errors.firstName && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-bold">{errors.firstName.message}</p>}
            </div>

            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                {...register("nationalId")}
                type="password"
                autoComplete="current-password"
                placeholder="National ID Number"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-dcp-green transition"
              />
              {errors.nationalId && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-bold">{errors.nationalId.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-dcp-green text-white font-black uppercase tracking-widest text-sm py-3 rounded-xl hover:bg-dcp-green/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : "Log In to Dashboard"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6 font-bold uppercase tracking-widest">
          Not a member? You need an official invite link to register.
        </p>
      </div>
    </div>
  );
}
