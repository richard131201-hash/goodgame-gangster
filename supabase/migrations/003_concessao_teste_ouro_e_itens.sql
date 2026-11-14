-- ===== INICIO DA MIGRACAO 003 (003_concessao_teste_ouro_e_itens.sql) =====
-- CONCESSÃO DE TESTE (pedido do fundador, 2026-11-14): +10.000 de ouro e os 8 itens com arte (4 chapéus e 4 peitorais) na Mala
-- de 2 jogadores: "kyaa" e "Chacal" (o personagem do fundador). Pronta para colar e rodar, sem mudar nada.
--
-- O que faz, em cada jogador achado pelo nome (sem diferenciar maiúscula de minúscula):
--  * soma 10.000 ao ouro e ao campo goldGrant (o servidor só aceita ouro acima do teto normal para quem tem goldGrant);
--  * tira da Mala TUDO o que não está equipado e põe os 8 itens (níveis 1, pontos mínimos, aparências 0 a 3 de cada slot);
--  * NÃO mexe no que está equipado: a arma equipada e os equipamentos equipados ficam (senão o servidor recusa o save).
-- Rodar UMA vez. Se rodar duas vezes, soma o ouro de novo e repõe os itens.
-- Depois de rodar: o jogador sai do jogo e entra de novo (Ctrl+F5) para ver o novo save.

with nomes as (
  select unnest(array[
    'kyaa',
    'Chacal'
  ]) as n
),
novos as (
  select jsonb_build_array(
    jsonb_build_object('id','g_chapeu_teste1','slot',0,'gear',jsonb_build_object('slot','chapeu','level',1,'points',jsonb_build_object('attack',1,'life',0,'astucia',0,'tenacidade',0),'variant',0)),
    jsonb_build_object('id','g_chapeu_teste2','slot',1,'gear',jsonb_build_object('slot','chapeu','level',1,'points',jsonb_build_object('attack',0,'life',1,'astucia',0,'tenacidade',0),'variant',1)),
    jsonb_build_object('id','g_chapeu_teste3','slot',2,'gear',jsonb_build_object('slot','chapeu','level',1,'points',jsonb_build_object('attack',0,'life',0,'astucia',1,'tenacidade',0),'variant',2)),
    jsonb_build_object('id','g_chapeu_teste4','slot',3,'gear',jsonb_build_object('slot','chapeu','level',1,'points',jsonb_build_object('attack',0,'life',0,'astucia',0,'tenacidade',1),'variant',3)),
    jsonb_build_object('id','g_peitoral_teste1','slot',4,'gear',jsonb_build_object('slot','peitoral','level',1,'points',jsonb_build_object('attack',1,'life',0,'astucia',0,'tenacidade',0),'variant',0)),
    jsonb_build_object('id','g_peitoral_teste2','slot',5,'gear',jsonb_build_object('slot','peitoral','level',1,'points',jsonb_build_object('attack',0,'life',1,'astucia',0,'tenacidade',0),'variant',1)),
    jsonb_build_object('id','g_peitoral_teste3','slot',6,'gear',jsonb_build_object('slot','peitoral','level',1,'points',jsonb_build_object('attack',0,'life',0,'astucia',1,'tenacidade',0),'variant',2)),
    jsonb_build_object('id','g_peitoral_teste4','slot',7,'gear',jsonb_build_object('slot','peitoral','level',1,'points',jsonb_build_object('attack',0,'life',0,'astucia',0,'tenacidade',1),'variant',3))
  ) as itens
)
update public.players p
set save = p.save || jsonb_build_object(
      'gold',      coalesce((p.save->>'gold')::bigint, 0) + 10000,
      'goldGrant', coalesce((p.save->>'goldGrant')::bigint, 0) + 10000,
      'inventory',
        coalesce((
          select jsonb_agg(i)
          from jsonb_array_elements(coalesce(p.save->'inventory', '[]'::jsonb)) as i
          where (i->>'id') = 'item_' || coalesce(p.save->'equipped'->>'weaponId', '')
             or (i->>'id') in (select e.value from jsonb_each_text(coalesce(p.save->'equipped'->'gear', '{}'::jsonb)) as e)
        ), '[]'::jsonb) || (select itens from novos)
    ),
    updated_at = now()
where lower(p.name) in (select lower(n) from nomes);

-- Conferência: deve mostrar os 2 jogadores, ouro com +10.000 e a Mala com os 8 itens (mais o que estiver equipado)
select name, save->>'gold' as ouro, save->>'goldGrant' as concedido, jsonb_array_length(save->'inventory') as itens_na_lista
from public.players
where lower(name) in ('kyaa', 'chacal');
-- ===== FIM DA MIGRACAO 003 (003_concessao_teste_ouro_e_itens.sql) =====
