# TRUDON — Inteligência Contábil

Site institucional do escritório **TRUDON** (Kelly Picossi) — contabilidade, gestão
financeira e planejamento previdenciário, com atendimento 100% online no Brasil e no exterior.

## Estrutura

- `index.html` — site completo (HTML + CSS + JS em um único arquivo, sem build).
- `assets/` — logotipos.
  - `logo-trudon.png` — logo completo.
  - `logo-mark.png` — monograma (usado no header, hero, footer e favicon).

## Seções

1. **Hero** — proposta de valor + CTA "Quero uma Análise Estratégica" (WhatsApp).
2. **Soluções** (abas): Empresas · Previdência · Brasileiros no Exterior · Perícias & Assistência.
3. **Quem sou eu** — apresentação da fundadora.
4. **Por que a TRUDON?** — diferenciais.
5. **Como funciona** — 3 passos.
6. **Perguntas frequentes** (FAQ).
7. **Contato** — formulário que envia a mensagem pelo WhatsApp.

## Tecnologia e robustez

- **Tipografia:** *Fraunces* (títulos) + *Hanken Grotesk* (corpo), via Google Fonts,
  com fallback para fontes do sistema.
- **Sem build:** HTML + CSS + JS em um único arquivo.
- **Funciona sem JavaScript:** o conteúdo aparece por padrão (as animações são apenas
  um aprimoramento); o FAQ usa `<details>` nativo e as 4 frentes ficam empilhadas.
- **Acessibilidade:** skip-link, ARIA em abas/menu/FAQ, navegação por teclado nas abas,
  foco visível e suporte a `prefers-reduced-motion`.
- **Cross-browser/responsivo:** prefixos `-webkit-`, `@supports` para `backdrop-filter`/
  `aspect-ratio`, sem overflow horizontal de 320px a 1920px.
- **SEO:** meta description, Open Graph, `theme-color` e JSON-LD (`AccountingService`).

## Como visualizar

Abra `index.html` diretamente no navegador. Por ser estático, pode ser hospedado
em GitHub Pages, Netlify, Vercel ou qualquer servidor de arquivos.

## Personalização rápida

- **Foto da fundadora:** em `#quem-sou-eu`, troque o bloco `.ph` por
  `<img src="assets/kelly.jpg" alt="Kelly Picossi, fundadora da TRUDON">`.
- **WhatsApp:** o número `5511993740120` aparece nos links/botões e no script do formulário.
- **Paleta:** definida nas variáveis CSS `:root` (azul-meia-noite + dourado).
- **Fontes:** trocáveis nas variáveis `--display` e `--body` (e no `<link>` do Google Fonts).
