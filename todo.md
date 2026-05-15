# Vida Pro — TODO

## FASE 1: Arquitetura base + rotas + layout + Dashboard ✅
- [x] Configurar tema escuro/claro com CSS variables (index.css) — tema roxo/violeta gamificado
- [x] Configurar App.tsx com todas as rotas e ThemeProvider switchable
- [x] Criar DashboardLayout com sidebar responsiva (useState, sem framer-motion)
- [x] Criar página Home (landing page pública com redirect automático)
- [x] Criar página Dashboard com cards de resumo diário
- [x] Schema Drizzle: todas as tabelas criadas e migração aplicada
- [x] Aplicar migração SQL no banco
- [x] server/db.ts com helpers de gamificação, hábitos, finanças, treinos, dieta
- [x] server/routers.ts com procedures: gamification, dashboard, habits, finances, workouts, diet
- [x] Páginas: Habits, Finances, Workouts, Diet, Focus (Pomodoro) funcionais
- [x] Páginas stub: Study, Calendar, Shop, Badges, DailyMissions
- [x] Zero erros TypeScript
- [x] 4 testes vitest passando

## FASE 2-4: Gamificação, Módulos e Testes ✅
- [x] Schema Drizzle + procedures tRPC completas
- [x] Páginas: Hábitos, Finanças, Treinos, Dieta, Foco, Estudos, Calendário, Loja, Badges, Missões
- [x] 23 testes vitest passando
- [x] Zero erros TypeScript
- [x] Zero manipulação de DOM
- [x] Checkpoint final Fase 4 (v3faa4708)

## COACH IA — FASE 1: Estrutura com Mock
- [ ] DB helper: `getHabitCompletionPercentage` para calcular % de hábitos do dia
- [ ] server/routers.ts: procedure tRPC `coach.getDica` (mock se sem chave)
- [ ] client/src/components/CoachCard.tsx: Card com dica + botão "Atualizar"
- [ ] client/src/pages/Dashboard.tsx: integrar CoachCard com {isOpen && <CoachCard />}
- [ ] Testes vitest para coach.getDica (mock)
- [ ] Validar: zero erros no console, sem DOM manual, mock funcionando
