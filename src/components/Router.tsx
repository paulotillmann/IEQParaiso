import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to.split('?')[0]);
    // Dispatch scroll event or scroll to top
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useNavigate deve ser usado dentro de um RouterProvider');
  }
  return context.navigate;
};

export const usePath = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('usePath deve ser usado dentro de um RouterProvider');
  }
  return context.path;
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({ to, children, ...props }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
};
