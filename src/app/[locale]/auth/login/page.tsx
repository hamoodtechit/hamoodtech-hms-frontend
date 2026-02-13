import { LoginForm } from "@/components/auth/login-form"
import { Building2, Stethoscope } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding & Visuals */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-neutral-950" />
           {/* Medical Grid Pattern */}
           <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" fill="none" className="text-neutral-500" />
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#grid-pattern)" />
           </svg>
           {/* Pulse Line */}
           <svg className="absolute bottom-0 left-0 right-0 h-48 w-full text-emerald-500/20" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="currentColor" fillOpacity="1" d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,213.3C840,203,960,149,1080,138.7C1200,128,1320,160,1380,176L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
           </svg>
        </div>
        
        <div className="relative z-10 flex items-center gap-2 text-lg font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-zinc-900">
            <Stethoscope className="h-5 w-5" />
          </div>
          HMS Pro
        </div>

        <div className="relative z-10 max-w-md">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Streamlining healthcare management for better patient outcomes. 
              Our platform provides the tools you need to deliver excellence.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">The HMS Team</footer>
          </blockquote>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-zinc-400">
           <Building2 className="h-4 w-4" />
           <span>Trusted by leading hospitals</span>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50/50 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-8">
           <LoginForm />
        </div>
      </div>
    </div>
  )
}
