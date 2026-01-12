import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      // Verifica se está rodando em modo standalone (instalado)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setShowPrompt(false);
        return true;
      }
      
      // Verifica se está instalado via navigator
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        setShowPrompt(false);
        return true;
      }
      
      return false;
    };

    // Verificar imediatamente
    if (checkIfInstalled()) {
      return;
    }

    // Variável local para rastrear se o evento foi capturado
    let eventCaptured = false;

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      eventCaptured = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Verificar novamente se não está instalado
      if (!checkIfInstalled()) {
        // Mostrar popup após 2 segundos (tempo para carregar a página)
        setTimeout(() => {
          if (!checkIfInstalled()) {
            setShowPrompt(true);
          }
        }, 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: Se o evento beforeinstallprompt não disparar em 3 segundos,
    // mostrar o popup mesmo assim (pode ser que o navegador não suporte o evento)
    const fallbackTimeout = setTimeout(() => {
      if (!checkIfInstalled() && !eventCaptured) {
        // Mesmo sem o evento, podemos mostrar o popup com instruções manuais
        setShowPrompt(true);
      }
    }, 3000);

    // Verificar periodicamente se foi instalado (para casos onde o evento não dispara)
    const checkInterval = setInterval(() => {
      if (checkIfInstalled()) {
        clearInterval(checkInterval);
        clearTimeout(fallbackTimeout);
        setShowPrompt(false);
      }
    }, 1000);

    // Limpar intervalo após 10 segundos
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearInterval(checkInterval);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Se não há deferredPrompt, apenas fecha o popup
      // O navegador pode não suportar o evento beforeinstallprompt
      // Nesse caso, o usuário precisará instalar manualmente pelo menu do navegador
      setShowPrompt(false);
      return;
    }

    try {
      // Mostrar o prompt de instalação nativo do navegador
      await deferredPrompt.prompt();
      
      // Aguardar a escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        // O app será instalado, então o popup não aparecerá mais
      } else {
        console.log('Usuário rejeitou a instalação');
        // Se rejeitou, o popup aparecerá novamente na próxima vez
      }

      // Limpar o prompt usado
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Erro ao instalar:', error);
      // Em caso de erro, apenas fecha o popup
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Apenas fecha o popup, mas não salva nada no localStorage
    // Assim ele aparecerá novamente na próxima vez que o app for aberto
    setShowPrompt(false);
  };

  // Não mostrar se já está instalado
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[#181818] rounded-lg shadow-2xl max-w-md w-full p-6 md:p-8 border border-white/10 animate-fade-in">
        {/* Botão Fechar */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Conteúdo */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Ícone */}
          <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-red-600/20 rounded-full p-4">
            <img
              src="/smartflix-logo.svg"
              alt="Smart Flix Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Título */}
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Instalar Smart Flix
          </h2>

          {/* Descrição */}
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            Instale o Smart Flix para uma experiência melhor. Acesso rápido, funcionamento offline e compatibilidade com Android TV.
          </p>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
            <button
              onClick={handleInstall}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors focus:outline-none focus:ring-4 focus:ring-red-500/50 text-lg"
            >
              Instalar Agora
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded transition-colors focus:outline-none focus:ring-4 focus:ring-gray-500/50 text-lg"
            >
              Depois
            </button>
          </div>

          {/* Info adicional */}
          <p className="text-xs text-gray-500 pt-2">
            Você pode instalar depois pelo menu do navegador
          </p>
        </div>
      </div>
    </div>
  );
};
