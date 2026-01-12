# Configuração PWA - Ícones

## Gerar Ícones do PWA

O app precisa de ícones PNG para o PWA. Você pode gerá-los de duas formas:

### Opção 1: Usar o logo SVG existente

1. Abra `/public/smartflix-logo.svg` em um editor de imagens
2. Exporte como PNG nas seguintes resoluções:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)
3. Salve os arquivos em `/public/`

### Opção 2: Usar ferramenta online

1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload do `smartflix-logo.svg`
3. Baixe os ícones gerados
4. Renomeie e coloque em `/public/`:
   - `icon-192.png`
   - `icon-512.png`

### Opção 3: Usar ImageMagick (CLI)

```bash
# Converter SVG para PNG 192x192
convert -background none -resize 192x192 public/smartflix-logo.svg public/icon-192.png

# Converter SVG para PNG 512x512
convert -background none -resize 512x512 public/smartflix-logo.svg public/icon-512.png
```

## Verificar Instalação PWA

Após gerar os ícones:

1. Execute `npm run build`
2. Execute `npm run preview`
3. Abra o app no navegador
4. Verifique o console para erros do Service Worker
5. Teste a instalação:
   - Chrome: Menu → "Instalar Smart Flix"
   - Android: Menu → "Adicionar à tela inicial"

## Testar no Android TV

1. Compile: `npm run build`
2. Sirva os arquivos de `dist/` via HTTPS
3. No Android TV, abra o Chrome
4. Navegue até a URL
5. Instale como PWA
6. Teste navegação com controle remoto

## Notas

- Os ícones devem ter fundo transparente ou sólido
- Use cores que contrastem bem com o tema (#141414)
- O SVG já está configurado como fallback no manifest
