import { supabase } from './supabaseClient';

export const AuthService = {
  signUp: async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  },
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },
  signOut: async () => {
    return supabase.auth.signOut();
  },
  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  onAuthStateChange: (callback: (user: any) => void) => {
    supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }
};
