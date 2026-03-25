import { createClient } from '@supabase/supabase-js';

// Check for environment variables with both prefixes (Vite and Create React App)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Debug logs to help troubleshoot connection issues
console.log('=== Supabase Configuration ===');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Undefined');
console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Found' : '❌ Undefined');
console.log('Supabase Connected:', !!supabaseUrl && !!supabaseAnonKey);

// Log URL for verification (safe to log)
if (supabaseUrl) {
  console.log('URL Value:', supabaseUrl);
} else {
  console.error('❌ Supabase URL is missing! Check your .env file for VITE_SUPABASE_URL');
  console.log('Current .env location:', import.meta.env);
}

// Log key prefix only (never log full key)
if (supabaseAnonKey) {
  console.log('Anon Key Prefix:', supabaseAnonKey.substring(0, 30) + '...');
  console.log('Key Length:', supabaseAnonKey.length);
} else {
  console.error('❌ Supabase Anon Key is missing! Check your .env file for VITE_SUPABASE_ANON_KEY');
}

console.log('================================');

// Custom storage wrapper for dynamic persistence (localStorage vs sessionStorage)
class SupabaseStorageAdapter {
  constructor(useLocalStorage = true) {
    this.storage = useLocalStorage ? window.localStorage : window.sessionStorage;
  }

  getItem(key) {
    return this.storage.getItem(key);
  }

  setItem(key, value) {
    this.storage.setItem(key, value);
  }

  removeItem(key) {
    this.storage.removeItem(key);
  }
}

// Validate configuration
let supabase;

if (supabaseUrl && supabaseAnonKey) {
  try {
    // Default to localStorage (persist across browser closes)
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: new SupabaseStorageAdapter(true), // Default: localStorage
      },
    });
    console.log('✅ Supabase client initialized successfully');

    // Test the connection
    supabase.auth.getSession().then(({ error }) => {
      if (error) {
        console.error('⚠️ Supabase auth session error:', error.message);
      } else {
        console.log('✅ Supabase auth connection OK');
      }
    });
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    console.error('This usually means your API key is invalid or malformed');
    supabase = null;
  }
} else {
  console.warn('⚠️ Supabase client not initialized - missing configuration');
  console.warn('Please check your .env file and restart the dev server');
}

// Export a wrapper that checks if client is ready
export const getSupabase = () => {
  if (!supabase) {
    const errorMsg = 'Supabase client not initialized. Check your .env file and restart dev server.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return supabase;
};

// Export function to create client with custom storage (for Remember Me toggle)
export const createSupabaseWithStorage = (useLocalStorage = true) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: new SupabaseStorageAdapter(useLocalStorage),
    },
  });
};

// Export the client directly for convenience (may be undefined if not configured)
export { supabase };

export default supabase;
