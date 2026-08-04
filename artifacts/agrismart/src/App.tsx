import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Layout } from '@/components/layout';

import Home from '@/pages/home';
import Dashboard from '@/pages/dashboard';
import Farms from '@/pages/farms';
import FarmDetail from '@/pages/farm-detail';
import CropDetail from '@/pages/crop-detail';
import Expenses from '@/pages/expenses';
import DiseaseDetection from '@/pages/disease-detection';
import Fertilizer from '@/pages/fertilizer';
import MarketPrices from '@/pages/market-prices';
import Weather from '@/pages/weather';
import Admin from '@/pages/admin';
import Settings from '@/pages/settings';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(142 60% 25%)",
    colorForeground: "hsl(142 40% 10%)",
    colorMutedForeground: "hsl(142 20% 40%)",
    colorDanger: "hsl(0 84% 45%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(142 40% 10%)",
    colorNeutral: "hsl(40 20% 85%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-md",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-[#1a3821]",
    headerSubtitle: "text-sm text-[#526656]",
    socialButtonsBlockButtonText: "font-medium text-[#1a3821]",
    formFieldLabel: "text-sm font-medium text-[#1a3821]",
    footerActionLink: "font-medium text-[#1a6635] hover:text-[#134d28]",
    footerActionText: "text-[#526656]",
    dividerText: "text-[#526656] text-xs font-medium",
    identityPreviewEditButton: "text-[#1a6635] hover:text-[#134d28]",
    formFieldSuccessText: "text-[#1a6635]",
    alertText: "text-sm",
    formButtonPrimary: "bg-[#1a6635] hover:bg-[#134d28] text-white font-medium py-2 px-4 rounded-md",
    formFieldInput: "flex h-10 w-full rounded-md border border-[#dcd6c8] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6635] focus-visible:ring-offset-2",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#fdfbf7] px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#fdfbf7] px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

const queryClient = new QueryClient();

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome to AgriSmart",
            subtitle: "Sign in to access your farm dashboard",
          },
        },
        signUp: {
          start: {
            title: "Join AgriSmart",
            subtitle: "Create an account to manage your farms",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
            <Route path="/farms"><ProtectedRoute component={Farms} /></Route>
            <Route path="/farms/:id"><ProtectedRoute component={FarmDetail} /></Route>
            <Route path="/crops/:id"><ProtectedRoute component={CropDetail} /></Route>
            <Route path="/expenses"><ProtectedRoute component={Expenses} /></Route>
            <Route path="/disease-detection"><ProtectedRoute component={DiseaseDetection} /></Route>
            <Route path="/fertilizer"><ProtectedRoute component={Fertilizer} /></Route>
            <Route path="/market-prices"><ProtectedRoute component={MarketPrices} /></Route>
            <Route path="/weather"><ProtectedRoute component={Weather} /></Route>
            <Route path="/admin"><ProtectedRoute component={Admin} /></Route>
            <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
            
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
