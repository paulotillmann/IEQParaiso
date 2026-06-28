import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

export type UserProfile = 'administrador' | 'secretaria' | 'pastor';

export interface UserDetails {
  id: string;
  nome: string;
  email: string;
  perfil: UserProfile;
  ativo: boolean;
  ultimo_acesso?: string;
  criado_em: string;
  atualizado_em: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userDetails: UserDetails | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isSecretaria: boolean;
  isPastor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 60 minutes in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { warning } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Helper getters for profiles
  const isAdmin = userDetails?.perfil === 'administrador';
  const isSecretaria = userDetails?.perfil === 'secretaria';
  const isPastor = userDetails?.perfil === 'pastor';

  const handleSignOut = async () => {
    try {
      // Clear inactivity timer
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

      // Registrar logoff no banco de dados antes do signOut
      try {
        await supabase.rpc('registrar_logoff');
      } catch (logoffErr) {
        console.warn('Falha ao registrar logoff no banco:', logoffErr);
      }

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserDetails(null);
    } catch (err) {
      console.error('Erro ao deslogar:', err);
    }
  };

  // Reset/Start inactivity timer
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    
    // Only set timer if user is logged in
    if (session) {
      inactivityTimer.current = setTimeout(() => {
        console.log('Sessão expirada por inatividade.');
        handleSignOut();
        warning('Sua sessão expirou devido a 60 minutos de inatividade.');
      }, INACTIVITY_TIMEOUT);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchErr) {
        throw fetchErr;
      }

      if (data) {
        const profile = data as UserDetails;
        
        // CA3 - Usuário inativo não pode acessar
        if (!profile.ativo) {
          setError('Sua conta está inativa. Entre em contato com o administrador.');
          await handleSignOut();
          return;
        }

        setUserDetails(profile);
        setError(null);

        // Atualizar data de último acesso de forma assíncrona
        supabase
          .from('usuarios')
          .update({ ultimo_acesso: new Date().toISOString() })
          .eq('id', userId)
          .then(({ error: updateErr }) => {
            if (updateErr) console.error('Erro ao atualizar último acesso:', updateErr);
          });
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err.message);
      // Se a tabela não existir ainda ou der erro, criamos um mock se o usuário for o primeiro
      // ou apenas mostramos erro.
      setError('Erro ao carregar dados do usuário.');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' && currentSession?.user) {
        setLoading(true);
        await fetchProfile(currentSession.user.id);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUserDetails(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Setup user activity listeners for inactivity timeout (60 min)
  useEffect(() => {
    if (!session) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Add listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Initial trigger
    resetInactivityTimer();

    return () => {
      // Remove listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [session]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userDetails,
      loading,
      error,
      signOut: handleSignOut,
      refreshProfile,
      isAdmin,
      isSecretaria,
      isPastor
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
