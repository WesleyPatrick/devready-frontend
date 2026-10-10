# DevReady Frontend

Interface web da DevReady, uma plataforma para treinar entrevistas técnicas de TI. A pessoa diz onde quer trabalhar, com qual stack e em qual senioridade, recebe uma trilha com o que essas empresas cobram e pratica com questões objetivas, desafios de código num editor e simulações com tempo marcado.

Este repositório é só a SPA. A API, o worker e o banco ficam no `devready-backend`; a pesquisa de vagas que alimenta as trilhas, no `devready-research`.

## Stack

React 19 com TypeScript, Vite, Redux Toolkit com RTK Query, React Router, Tailwind CSS 4 com shadcn/ui e o editor Monaco. Testes com Vitest, Testing Library e MSW; lint com oxlint e formatação com Prettier.

## Rodando localmente

Precisa de Node 22.22 ou superior (o React Router 8 exige) e pnpm 10. `corepack enable` instala o pnpm certo a partir do `package.json`; com nvm, `nvm use` lê o `.nvmrc`, que fixa a linha 22.

```bash
pnpm install
pnpm dev
```

A aplicação abre em http://localhost:5173. O Vite repassa `/api`, `/actuator`, `/oauth2` e `/login/oauth2` para `http://localhost:8080`, então suba o backend antes. Sem a API, a tela abre e o rodapé mostra "API indisponível". Não há variável de ambiente: toda chamada usa caminho relativo, e quem resolve o destino é o proxy (o Vite em desenvolvimento, o nginx em produção).

## Testes e qualidade

```bash
pnpm test          # Vitest, com o MSW no lugar da API
pnpm lint          # oxlint
pnpm typecheck     # tsc
pnpm format        # Prettier
pnpm build         # tsc e vite build, gera dist/
```

O CI roda `format:check`, `lint`, `typecheck`, `test` e `build` em todo push e pull request.

## Estrutura

| Pasta             | O que tem                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/app/`        | providers, store, rotas, guards, layouts e tema                                                             |
| `src/features/`   | uma pasta por funcionalidade (auth, career, track, questions, challenge, session, progress, admin e outras) |
| `src/components/` | componentes visuais compartilhados; o shadcn/ui fica em `components/ui`                                     |
| `src/lib/`        | API base com renovação de token, tratamento de erros, animações e utilitários                               |
| `src/test/`       | setup do Vitest, servidor MSW e os backends em memória dos testes                                           |
| `docker/`         | configuração do nginx da imagem de produção                                                                 |

A imagem de produção (`Dockerfile`) é um nginx que serve o build estático e faz proxy da API.

A documentação completa (arquitetura, decisões, API, banco, design da interface) acompanha o trabalho de conclusão de curso.
