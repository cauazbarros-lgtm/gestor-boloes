import { notFound } from 'next/navigation';
import { Trophy, CheckCircle2, Clock, XCircle, Download, MessageCircle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { formatBRL, formatDataHora } from '@/lib/utils';
import type { Aposta, BolaoComJogos } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface Props { params: { id: string } }

async function buscarAposta(id: string): Promise<{ aposta: Aposta; bolao: BolaoComJogos } | null> {
  const admin = createAdminClient();
  const { data: aposta } = await admin
    .from('apostas')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!aposta) return null;
  const { data: bolao } = await admin
    .from('boloes')
    .select('*')
    .eq('id', aposta.bolao_id)
    .single();
  const { data: jogos } = await admin
    .from('jogos')
    .select('*')
    .eq('bolao_id', aposta.bolao_id)
    .order('ordem', { ascending: true });
  if (!bolao) return null;
  return { aposta, bolao: { ...bolao, jogos: jogos ?? [] } };
}

const palpiteLabel: Record<string, string> = {
  casa: 'Casa',
  empate: 'Empate',
  fora: 'Fora',
};

export default async function CotaPage({ params }: Props) {
  const dados = await buscarAposta(params.id);
  if (!dados) notFound();
  const { aposta, bolao } = dados;

  // Calcula acertos (mesmo se ainda não estiver finalizado, conta os resultados já preenchidos)
  let acertos = 0;
  let jogosComResultado = 0;
  for (const jogo of bolao.jogos) {
    if (jogo.resultado) {
      jogosComResultado++;
      const p = aposta.palpites.find((pp) => pp.jogo_id === jogo.id);
      if (p?.palpite === jogo.resultado) acertos++;
    }
  }

  const statusInfo = {
    pendente: { label: 'Pagamento pendente', icon: Clock, badgeVariant: 'warning' as const, cor: 'text-amber-700' },
    confirmado: { label: 'Pagamento confirmado', icon: CheckCircle2, badgeVariant: 'success' as const, cor: 'text-emerald-700' },
    cancelado: { label: 'Cancelado', icon: XCircle, badgeVariant: 'danger' as const, cor: 'text-red-700' },
  }[aposta.status_pagamento];

  const StatusIcon = statusInfo.icon;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP;

  return (
    <main className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-2xl mx-auto px-4">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-brasil-verde to-brasil-verde-escuro text-white p-6">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Comprovante de cota</div>
            <div className="text-4xl font-bold tabular-nums">{aposta.numero_cota}</div>
            <div className="mt-2 text-sm opacity-90">{bolao.titulo}</div>
            <div className="text-xs opacity-75 mt-0.5">Rodada {bolao.rodada}</div>
          </div>

          {/* Status */}
          <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3 ${statusInfo.cor}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="font-semibold">{statusInfo.label}</span>
            <Badge variant={statusInfo.badgeVariant} className="ml-auto">
              {aposta.status_pagamento}
            </Badge>
          </div>

          {/* Ganhador? */}
          {aposta.ganhador && (
            <div className="bg-gradient-to-r from-brasil-amarelo to-amber-300 px-6 py-4 flex items-center gap-3 text-gray-900">
              <Trophy className="h-7 w-7" />
              <div>
                <div className="font-bold text-lg">🏆 Você é o ganhador!</div>
                <div className="text-sm">Entre em contato com o organizador para receber o prêmio.</div>
              </div>
            </div>
          )}

          {/* Dados */}
          <div className="p-6 grid grid-cols-2 gap-4 text-sm border-b border-gray-100">
            <div>
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Apostador</div>
              <div className="font-semibold text-gray-900">{aposta.nome_apostador}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Valor</div>
              <div className="font-semibold text-gray-900">{formatBRL(bolao.valor_cota)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">E-mail</div>
              <div className="font-semibold text-gray-900 text-xs break-all">{aposta.email_apostador}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Registrado em</div>
              <div className="font-semibold text-gray-900 text-xs">{formatDataHora(aposta.criado_em)}</div>
            </div>
          </div>

          {/* Palpites + resultados */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Seus palpites</h2>
              {jogosComResultado > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500">Acertos: </span>
                  <span className="font-bold text-brasil-verde tabular-nums">
                    {acertos}/{jogosComResultado}
                  </span>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {bolao.jogos.map((jogo, idx) => {
                const p = aposta.palpites.find((pp) => pp.jogo_id === jogo.id);
                const acertou = jogo.resultado && p?.palpite === jogo.resultado;
                const errou = jogo.resultado && p?.palpite !== jogo.resultado;
                return (
                  <div
                    key={jogo.id}
                    className={`flex items-center justify-between px-3 py-3 text-sm border-b last:border-0 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-700 flex-1">
                      <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
                      {jogo.time_casa} × {jogo.time_fora}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700 min-w-[60px] text-right">
                        {p ? palpiteLabel[p.palpite] : '—'}
                      </span>
                      {jogo.resultado && (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            acertou ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {acertou ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          <div className="p-6 pt-0 grid grid-cols-2 gap-2 no-print">
            <a
              href={`/api/cotas/${aposta.id}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border-2 border-brasil-verde text-brasil-verde hover:bg-brasil-verde hover:text-white font-semibold transition"
            >
              <Download className="h-4 w-4" /> Baixar PDF
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Olá! Cota ${aposta.numero_cota}`)}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
              >
                <MessageCircle className="h-4 w-4" /> Contato
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          BolãoPro · {bolao.titulo}
        </p>
      </div>
    </main>
  );
}
