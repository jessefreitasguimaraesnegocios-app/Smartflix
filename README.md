# Smart Flix - Streaming App para Android TV

App de streaming React/Vite otimizado para Android TV com autoplay inteligente de trailers e suporte PWA.

## 🎯 Funcionalidades

### ✅ Android TV (10-foot UI)
- **Navegação por controle remoto**: Suporte completo a DPAD (cima, baixo, esquerda, direita)
- **Sistema de foco**: Apenas 1 card focado por vez com visual claro (scale + glow)
- **Layout 10-foot UI**: Cards grandes, texto grande, espaçamento amplo
- **Nenhuma dependência de mouse**: Funciona 100% com teclado/controle

### ✅ Autoplay Inteligente de Trailers
- **Delay de 800ms**: Aguarda antes de iniciar o trailer
- **Inicia mutado**: Trailer sempre inicia sem som
- **Para automaticamente**: Remove iframe quando perde foco
- **Apenas 1 trailer ativo**: Scroll rápido não dispara múltiplos trailers
- **Sem YouTube API**: Usa iframe direto do YouTube

### ✅ Player com Som
- **Tela de detalhes**: Ao pressionar OK/Enter, navega para player com som
- **Player em destaque**: Ocupa tela inteira com controles otimizados

### ✅ PWA Instalável
- **Manifest configurado**: Nome, ícones, cores, orientação landscape
- **Service Worker**: Cache de assets, imagens e dados da API TMDB
- **Instalável**: Desktop, mobile e TV

### ✅ Performance
- **Lazy loading**: Imagens carregam sob demanda
- **Cancelamento inteligente**: Autoplay cancela se card sair do foco
- **Nenhum iframe simultâneo**: Remove iframes não utilizados
- **Otimizado para TV box fraco**: Carregamento eficiente

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

### Preview do Build

```bash
npm run preview
```

## 📱 Testando no Android TV

### 1. Via Chrome (Desktop)
- Abra o DevTools (F12)
- Ative o modo de dispositivo móvel
- Simule navegação por teclado (setas, Enter)

### 2. Via Android TV Box
1. Compile o app: `npm run build`
2. Sirva os arquivos da pasta `dist` em um servidor HTTPS
3. Abra o Chrome no Android TV
4. Navegue até a URL do app
5. Instale como PWA (menu do Chrome → "Adicionar à tela inicial")

### 3. Via Android TV WebView
- O app funciona nativamente no WebView do Android TV
- Navegação por controle remoto funciona automaticamente

## 🎮 Controles

### Navegação
- **Setas (↑↓←→)**: Navegar entre cards
- **Enter / Espaço**: Selecionar card (abre modal ou player)
- **Tab**: Navegar entre elementos focáveis

### Autoplay de Trailer
- Ao focar em um card, aguarda 800ms
- Se mantiver o foco, inicia o trailer mutado
- Ao perder foco, para e remove o iframe

### Player
- **Enter / Espaço**: Iniciar reprodução
- **X / ESC**: Fechar player
- Controles de volume e navegação de episódios (para séries)

## 📦 Estrutura do Projeto

```
├── components/
│   ├── TvTrailerCard.tsx    # Card com autoplay de trailer
│   ├── MovieRow.tsx          # Linha de filmes adaptada para TV
│   ├── Hero.tsx              # Hero section com trailer
│   ├── MovieModal.tsx        # Modal de detalhes
│   ├── VideoPlayer.tsx       # Player de vídeo
│   └── ...
├── hooks/
│   ├── useTvFocus.ts         # Hook para navegação TV
│   └── useAutoplayTrailer.ts # Hook para autoplay inteligente
├── services/
│   └── movieService.ts       # Serviços da API TMDB
├── public/
│   ├── manifest.json         # Manifest PWA
│   └── smartflix-logo.svg    # Logo do app
└── vite.config.ts            # Configuração Vite + PWA
```

## 🔧 Configuração PWA

O PWA está configurado com:
- **Manifest**: `public/manifest.json`
- **Service Worker**: Gerado automaticamente pelo `vite-plugin-pwa`
- **Cache Strategy**:
  - API TMDB: NetworkFirst (24h)
  - Imagens TMDB: CacheFirst (7 dias)
  - YouTube: NetworkFirst (1h)

## 🎨 Estilos 10-foot UI

- **Cards grandes**: 280px-320px de largura
- **Texto grande**: Títulos 2xl-3xl, descrições lg-xl
- **Espaçamento amplo**: Gaps de 4-6 entre elementos
- **Foco visível**: Ring branco com glow
- **Scroll suave**: Comportamento otimizado para TV

## 📝 Notas Técnicas

### Autoplay de Trailer
- Usa iframe do YouTube: `https://www.youtube.com/embed/{trailerKey}?autoplay=1&mute=1`
- Delay de 800ms antes de iniciar
- Remove iframe quando perde foco para economizar recursos

### Navegação TV
- Sistema de foco por linha e coluna
- Scroll automático para manter card focado visível
- Suporte a teclado e controle remoto Android TV

### Performance
- Lazy loading de imagens nativo
- Cancelamento de autoplay quando não necessário
- Apenas 1 iframe de trailer ativo por vez

## 🐛 Troubleshooting

### Service Worker não registra
- Certifique-se de servir via HTTPS (ou localhost)
- Limpe o cache do navegador
- Verifique o console para erros

### Autoplay não funciona
- Verifique se o trailer existe no TMDB
- Confira o console para erros de iframe
- Certifique-se de que o card está focado por 800ms+

### Navegação não funciona
- Verifique se os elementos têm `tabIndex={0}`
- Confirme que os handlers de teclado estão corretos
- Teste com teclado físico primeiro

## 📄 Licença

Este projeto é de código aberto.

## 👨‍💻 Desenvolvido por

Jessé Gostoso & Preto

---

**Compatível com**: Android TV, Chrome, Firefox, Safari, Edge
**Requisitos**: Navegador moderno com suporte a ES6+ e Service Workers
