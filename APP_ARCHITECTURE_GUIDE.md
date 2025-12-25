# Guide Architecture & Configuration Mobile/Paiements

## 📱 Vue d'Ensemble Application

**ByProject** - Plateforme de gestion de projets de construction

### Stack Technique Actuel
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Services**: OpenAI API, Email, SMS

### Tables Base de Données
```
projects → materials → prices
         → suppliers
         → photos
templates → template_materials (avec supplier info)
users (Supabase Auth)
```

---

## 💳 PARTIE 1: Intégration Paiements (Stripe)

### Installation
```bash
npm install @stripe/stripe-js stripe
```

### Configuration
```typescript
// lib/stripe/config.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  PRO: {
    name: 'Pro',
    priceId: 'price_pro_monthly',
    price: 29.99
  },
  ENTERPRISE: {
    priceId: 'price_enterprise_monthly',
    price: 99.99
  }
};
```

### API Route Checkout
```typescript
// app/api/stripe/create-checkout/route.ts
export async function POST(req: Request) {
  const { priceId } = await req.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/subscription/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/subscription/cancel`,
    metadata: { userId: user.id }
  });
  
  return NextResponse.json({ url: session.url });
}
```

### Webhook Handler
```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Activer abonnement
      await supabase.from('user_subscriptions').upsert({
        user_id: session.metadata.userId,
        status: 'active',
        plan: 'pro'
      });
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

### Migration DB
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL,
  plan TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE
);
```

### Variables d'Environnement
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📱 PARTIE 2: Configuration React Native

### Initialisation Projet
```bash
npx create-expo-app byproject-mobile
cd byproject-mobile
```

### Installation Dépendances
```bash
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/native-stack
npm install @tanstack/react-query
npm install @react-native-async-storage/async-storage
npm install expo-image-picker
```

### Configuration Supabase Mobile
```typescript
// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ebmgtfftimezuuxxzyjm.supabase.co',
  'YOUR_ANON_KEY',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true
    }
  }
);
```

### Hook Authentication
```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);
  
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };
  
  return { user, signIn };
}
```

### Hook Projects avec React Query
```typescript
// src/hooks/useProjects.ts
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*, materials(*)')
        .order('created_at', { ascending: false });
      return data;
    }
  });
}
```

### Screen Login
```typescript
// src/screens/LoginScreen.tsx
export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  
  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) alert(error.message);
  };
  
  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Connexion" onPress={handleLogin} />
    </View>
  );
}
```

### Structure Projet Mobile
```
src/
├── components/     # UI components
├── screens/        # Écrans app
│   ├── auth/
│   ├── projects/
│   ├── materials/
│   └── profile/
├── hooks/          # Custom hooks
├── navigation/     # Navigation config
└── lib/            # Supabase config
```

### Navigation Setup
```typescript
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔐 Sécurité & Best Practices

### Web (Next.js)
- ✅ Utiliser Server Components pour secrets
- ✅ Valider inputs côté serveur
- ✅ RLS Supabase activé
- ✅ HTTPS uniquement en production

### Mobile (React Native)
- ✅ Stocker tokens dans AsyncStorage sécurisé
- ✅ Utiliser Expo SecureStore si sensible
- ✅ Valider données reçues
- ✅ Timeout API requests

---

## 🚀 Déploiement

### Web
```bash
vercel --prod
```

### Mobile
```bash
# iOS
expo build:ios

# Android
expo build:android
```

---

## 📚 Documentation Complète

Fichiers de référence :
- `MATERIALS_FILTERING_SYSTEM.md` - Système de filtrage
- `TEMPLATE_PRESENTATION_SUPPLIERS.md` - Templates & fournisseurs
- `STORAGE_BUCKET_CREATED.md` - Configuration storage

---

**Version**: 1.0.0  
**Date**: 2025-11-20  
**Status**: Ready for Integration
