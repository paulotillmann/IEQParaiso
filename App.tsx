import React from 'react';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { RouterProvider, usePath } from './src/components/Router';
import { ToastProvider } from './src/contexts/ToastContext';
import ProtectedLayout from './src/components/ProtectedLayout';

// Pages
import Login from './src/pages/Login';
import Dashboard from './src/pages/Dashboard';
import Membros from './src/pages/Membros';
import NovoMembro from './src/pages/NovoMembro';
import FichaMembro from './src/pages/FichaMembro';
import Cargos from './src/pages/Cargos';
import Usuarios from './src/pages/Usuarios';
import LogsAtividade from './src/pages/LogsAtividade';
import Visitantes from './src/pages/Visitantes';
import NovoVisitante from './src/pages/NovoVisitante';
import Cultos from './src/pages/Cultos';
import NovoCulto from './src/pages/NovoCulto';
import Presencas from './src/pages/Presencas';
import PresencasVisitantes from './src/pages/PresencasVisitantes';
import DizimosOfertas from './src/pages/DizimosOfertas';

// Route Guard component
const RoutesResolver: React.FC = () => {
  const currentPath = usePath();
  const { user, userDetails, loading } = useAuth();
  
  // Render loading state while checking session
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-400">Carregando IEQ Paraíso...</p>
        </div>
      </div>
    );
  }

  // Handle Login screen separately or recovery flow
  const isRecoveryMode = window.location.hash.includes('type=recovery');
  if (currentPath === '/login' || isRecoveryMode) {
    return <Login />;
  }

  // Guard for protected routes: If not authenticated, redirect to Login
  if (!user || !userDetails) {
    // Modify URL history to avoid loop
    window.history.replaceState({}, '', '/login');
    return <Login />;
  }

  // Route switcher
  const renderRoute = () => {
    // 1. Dashboard
    if (currentPath === '/dashboard' || currentPath === '/') {
      return (
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      );
    }

    // 2. Cargos
    if (currentPath === '/cargos') {
      return (
        <ProtectedLayout>
          <Cargos />
        </ProtectedLayout>
      );
    }

    // 3. Usuarios (Only for Admin)
    if (currentPath === '/usuarios') {
      if (userDetails.perfil !== 'administrador') {
        window.history.replaceState({}, '', '/dashboard');
        return (
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        );
      }
      return (
        <ProtectedLayout>
          <Usuarios />
        </ProtectedLayout>
      );
    }

    // 3.5. Logs de Atividade (Only for Admin)
    if (currentPath === '/logs') {
      if (userDetails.perfil !== 'administrador') {
        window.history.replaceState({}, '', '/dashboard');
        return (
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        );
      }
      return (
        <ProtectedLayout>
          <LogsAtividade />
        </ProtectedLayout>
      );
    }

    // 4. Membros list
    if (currentPath === '/membros') {
      return (
        <ProtectedLayout>
          <Membros />
        </ProtectedLayout>
      );
    }

    // 4.5. Visitantes list
    if (currentPath === '/visitantes') {
      return (
        <ProtectedLayout>
          <Visitantes />
        </ProtectedLayout>
      );
    }

    // 4.6. Novo Visitante (Cadastro / Edição)
    if (currentPath === '/visitantes/novo') {
      if (!['administrador', 'secretaria'].includes(userDetails.perfil)) {
        window.history.replaceState({}, '', '/visitantes');
        return (
          <ProtectedLayout>
            <Visitantes />
          </ProtectedLayout>
        );
      }
      return (
        <ProtectedLayout>
          <NovoVisitante />
        </ProtectedLayout>
      );
    }

    // 4.7. Cultos list
    if (currentPath === '/cultos') {
      return (
        <ProtectedLayout>
          <Cultos />
        </ProtectedLayout>
      );
    }

    // 4.8. Novo Culto (Cadastro / Edição)
    if (currentPath === '/cultos/novo') {
      if (!['administrador', 'secretaria'].includes(userDetails.perfil)) {
        window.history.replaceState({}, '', '/cultos');
        return (
          <ProtectedLayout>
            <Cultos />
          </ProtectedLayout>
        );
      }
      return (
        <ProtectedLayout>
          <NovoCulto />
        </ProtectedLayout>
      );
    }

    // 4.9. Presença de Membros
    if (currentPath === '/presencas') {
      return (
        <ProtectedLayout>
          <Presencas />
        </ProtectedLayout>
      );
    }

    // 4.10. Presença de Visitantes
    if (currentPath === '/presencas-visitantes') {
      return (
        <ProtectedLayout>
          <PresencasVisitantes />
        </ProtectedLayout>
      );
    }

    // 4.11. Dízimos e Ofertas
    if (currentPath === '/dizimos-ofertas') {
      return (
        <ProtectedLayout>
          <DizimosOfertas />
        </ProtectedLayout>
      );
    }

    // 5. Novo Membro (Cadastro / Edição)
    if (currentPath === '/membros/novo') {
      if (!['administrador', 'secretaria'].includes(userDetails.perfil)) {
        window.history.replaceState({}, '', '/membros');
        return (
          <ProtectedLayout>
            <Membros />
          </ProtectedLayout>
        );
      }
      return (
        <ProtectedLayout>
          <NovoMembro />
        </ProtectedLayout>
      );
    }

    // 6. Ficha do Membro (Dynamic routing check e.g., /membros/uuid)
    const memberIdPattern = /^\/membros\/([^/]+)$/;
    const match = currentPath.match(memberIdPattern);
    
    if (match) {
      // Exclude '/membros/novo' which is caught by previous check
      if (match[1] !== 'novo') {
        return (
          <ProtectedLayout>
            <FichaMembro />
          </ProtectedLayout>
        );
      }
    }

    // Fallback default redirect to Dashboard
    window.history.replaceState({}, '', '/dashboard');
    return (
      <ProtectedLayout>
        <Dashboard />
      </ProtectedLayout>
    );
  };

  return renderRoute();
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <RouterProvider>
        <AuthProvider>
          <RoutesResolver />
        </AuthProvider>
      </RouterProvider>
    </ToastProvider>
  );
};

export default App;