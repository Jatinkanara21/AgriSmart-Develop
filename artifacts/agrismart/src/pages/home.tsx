import { Link } from "wouter";
import { ArrowRight, Leaf, Sprout, ShieldCheck, BarChart3, CloudSun, Target, Beaker, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">AgriSmart</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_40%)] opacity-[0.05]" />
          
          <div className="container mx-auto max-w-5xl relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8">
              <Leaf className="mr-2 h-4 w-4" />
              The modern operating system for your farm
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-8 leading-[1.1]">
              Manage your farm with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">confidence.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              AgriSmart provides intelligent decision support, real-time market insights, and comprehensive tracking for modern Indian farmers. Your expert agronomist in your pocket.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
                <Link href="/sign-up">
                  Start Managing Your Farm <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border hover:bg-accent hover:text-accent-foreground" asChild>
                <Link href="/sign-in">
                  Sign In to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card border-t border-b">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to grow better.</h2>
              <p className="text-lg text-muted-foreground">Data-driven tools designed specifically for the challenges of modern agriculture.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Crop Management",
                  desc: "Track planting dates, harvest expectations, and yields for all your active fields.",
                  icon: Target,
                  color: "text-blue-600",
                  bg: "bg-blue-600/10"
                },
                {
                  title: "Expense Tracking",
                  desc: "Monitor costs for seeds, fertilizers, labor, and irrigation with clear category breakdowns.",
                  icon: BarChart3,
                  color: "text-amber-600",
                  bg: "bg-amber-600/10"
                },
                {
                  title: "Disease Detection",
                  desc: "Upload photos of affected leaves to get instant, AI-powered disease identification and treatment advice.",
                  icon: ShieldCheck,
                  color: "text-red-600",
                  bg: "bg-red-600/10"
                },
                {
                  title: "Fertilizer Recommendations",
                  desc: "Input your soil composition and get precise NPK dosage recommendations for optimal yields.",
                  icon: Beaker,
                  color: "text-green-600",
                  bg: "bg-green-600/10"
                },
                {
                  title: "Live Market Prices",
                  desc: "Make informed selling decisions with access to daily crop prices across local markets.",
                  icon: TrendingUp,
                  color: "text-purple-600",
                  bg: "bg-purple-600/10"
                },
                {
                  title: "Hyperlocal Weather",
                  desc: "7-day daily forecasts alongside farming-specific advice based on upcoming conditions.",
                  icon: CloudSun,
                  color: "text-sky-600",
                  bg: "bg-sky-600/10"
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl border bg-background hover-elevate transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-24 bg-primary text-primary-foreground text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
          <div className="container mx-auto max-w-3xl relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your farm?</h2>
            <p className="text-lg text-primary-foreground/80 mb-10 max-w-xl mx-auto">
              Join thousands of modern farmers making smarter, data-driven decisions every day.
            </p>
            <Button size="lg" className="h-14 px-10 text-lg bg-white text-primary hover:bg-white/90 shadow-xl" asChild>
              <Link href="/sign-up">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="py-8 text-center text-sm text-muted-foreground border-t bg-card">
        <p>© {new Date().getFullYear()} AgriSmart. All rights reserved.</p>
      </footer>
    </div>
  );
}
