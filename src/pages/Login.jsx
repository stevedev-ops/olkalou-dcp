import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import LoginForm from "../components/LoginForm";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-3 shadow-xl mb-4">
            <img src={logo} alt="DCP" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dcp-green mb-1">Democracy for Citizens Party</p>
          <h1 className="text-2xl font-black text-white">Member Login</h1>
        </div>

        <LoginForm 
          onLogin={(id, token) => {
            onLogin(id, token);
            // Redirection logic is handled inside LoginForm, but we pass the handler
          }} 
        />

        <p className="text-center text-[10px] text-slate-600 mt-6 font-bold uppercase tracking-widest leading-loose">
          Not a member? You need an official invite link to register.<br/>
          Contact your local mobilizing team.
        </p>
      </div>
    </div>
  );
}
