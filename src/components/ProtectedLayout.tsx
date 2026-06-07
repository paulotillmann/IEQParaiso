import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, usePath, Link } from './Router';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sun, 
  Moon,
  UserCheck,
  Smile,
  Calendar,
  ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDetails, signOut, isAdmin, isSecretaria, loading } = useAuth();
  const navigate = useNavigate();
  const currentPath = usePath();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!user || !userDetails) return null;

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Membros', path: '/membros', icon: Users, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Visitantes', path: '/visitantes', icon: Smile, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Cultos', path: '/cultos', icon: Calendar, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Presença Membros', path: '/presencas', icon: UserCheck, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Presença Visitantes', path: '/presencas-visitantes', icon: ClipboardCheck, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Cargos', path: '/cargos', icon: FileText, roles: ['administrador', 'secretaria', 'pastor'] },
    { name: 'Gestão de Usuários', path: '/usuarios', icon: Shield, roles: ['administrador'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userDetails.perfil));

  const getProfileBadgeColor = (perfil: string) => {
    switch (perfil) {
      case 'administrador':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'secretaria':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'pastor':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getProfileName = (perfil: string) => {
    switch (perfil) {
      case 'administrador': return 'Administrador';
      case 'secretaria': return 'Secretária';
      case 'pastor': return 'Pastor';
      default: return perfil;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 76 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col h-full border-r bg-card relative shrink-0"
      >
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border bg-background hover:bg-muted text-muted-foreground shadow-sm transition-colors z-20"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo and Name */}
        <div className="flex h-20 items-center px-5 border-b gap-3 overflow-hidden select-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-600/30">
            IEQ
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sm leading-tight tracking-tight uppercase">IEQ Paraíso</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Araguari/MG</span>
            </motion.div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {filteredNavItems.map(item => {
            const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center h-11 px-3 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' 
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
                
                {/* Tooltip on Collapsed Sidebar */}
                {isSidebarCollapsed && (
                  <div className="absolute left-16 scale-0 rounded bg-foreground px-2 py-1 text-xs text-background font-medium group-hover:scale-100 transition-all origin-left duration-200 z-30 shadow-md">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with Profile and System Buttons */}
        <div className="border-t p-4 flex flex-col space-y-4">
          
          {/* Theme Switch & Quick Settings */}
          <div className={`flex items-center justify-between ${isSidebarCollapsed ? 'flex-col space-y-2' : ''}`}>
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground transition-colors"
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {!isSidebarCollapsed && (
              <span className="text-xs text-muted-foreground font-medium">
                Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            )}
            
            <button
              onClick={signOut}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive transition-colors"
              title="Sair do Sistema"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 pt-2 overflow-hidden border-t">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900">
              {userDetails.nome.substring(0, 2).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-semibold text-sm truncate leading-tight text-foreground">{userDetails.nome}</span>
                <span className={`text-[10px] px-1.5 py-0.5 mt-1 rounded font-medium w-max leading-none ${getProfileBadgeColor(userDetails.perfil)}`}>
                  {getProfileName(userDetails.perfil)}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black md:hidden z-40"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-card border-r flex flex-col md:hidden z-50 p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-600/30">
                    IEQ
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase leading-tight">IEQ Paraíso</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Araguari/MG</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 border rounded-lg hover:bg-muted"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 space-y-1.5">
                {filteredNavItems.map(item => {
                  const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center h-11 px-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <item.icon size={20} className="mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* User profile & controls */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleTheme}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground"
                  >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <button
                    onClick={signOut}
                    className="flex items-center px-4 py-2 border border-destructive/20 hover:bg-destructive/10 text-destructive text-sm font-medium rounded-lg"
                  >
                    <LogOut size={16} className="mr-2" /> Sair
                  </button>
                </div>

                <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-900">
                    {userDetails.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{userDetails.nome}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 mt-1 rounded font-medium w-max leading-none ${getProfileBadgeColor(userDetails.perfil)}`}>
                      {getProfileName(userDetails.perfil)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        
        {/* Header - Mobile */}
        <header className="flex md:hidden h-16 items-center justify-between px-4 border-b bg-card shrink-0">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 border rounded-lg hover:bg-muted"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm tracking-wide uppercase">IEQ Paraíso</span>
          <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
            {userDetails.nome.substring(0, 2).toUpperCase()}
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
};
export default ProtectedLayout;
