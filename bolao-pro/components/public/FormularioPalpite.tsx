'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle } from 'lucide-react';
import type { BolaoComJogos, ResultadoJogo, Palpite } from '@/types';
import { JogoCard } from './JogoCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CotaComprovante } from './CotaComprovante';
import { Modal } from '@/components/ui/Modal';
import { useToast, ToastProvider } from '@/components/ui/Toast';
import { formatBRL, prazoExpirado } from '@/lib/utils';

interface Props {
  bolao: BolaoComJogos;
}

function FormularioInterno({ bolao }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [palpites, setPalpites] = useState<Record<string, ResultadoJogo>>({});
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    numero_cota: string;
    aposta_id: string;
    link_cota: string;
  } | null>(null);

  const totalJogos = bolao.jogos.length;
  const totalPalpites = Object.keys(palpites).length;
  const completo = totalPalpites === totalJogos;
  const apostasEncerradas = bolao.status !== 'aberto' || prazoExpirado(bolao.data_limite);

  function selecionar(jogoId: string, palpite: ResultadoJogo) {
    setPalpites((prev) => ({ ...prev, [jogoId]: palpite }));
  }

  async function submeter() {
    setErro(null);
    if (!completo) {
      setErro('Você precisa palpitar em todos os jogos.');
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }
    if (!nome.trim() || !email.trim()) {
      setErro('Preencha seu nome e e-mail.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErro('E-mail inválido.');
      return;
    }

    const palpitesArr: Palpite[] = Object.entries(palpites).map(([jogo_id, palpite]) => ({
      jogo_id,
      palpite,
    }));

    setLoading(true);
    try {
      const res = await fetch('/api/apostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bolao_id: bolao.id,
          nome_apostador: nome,
          email_apostador: email,
          telefone_apostador: telefone || null,
          palpites: palpitesArr,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro ?? 'Erro ao registrar aposta');
      }
      setResultado({
        numero_cota: data.numero_cota,
        aposta_id: data.aposta_id,
        link_cota: data.link_cota,
      });
      toast.show('Palpite registrado com sucesso!', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      setErro(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (apostasEncerradas) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-amber-900 mb-1">Apostas encerradas</h2>
          <p className="text-amber-800">
            Este bolão não está mais aceitando novos palpites.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-32">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
            Seus palpites
          </h2>
          <p className="text-sm text-gray-600">
            Selecione um resultado para cada jogo da rodada.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brasil-verde transition-all"
                style={{ width: `${(totalPalpites / totalJogos) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 tabular-nums">
              {totalPalpites}/{totalJogos}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {bolao.jogos.map((jogo, idx) => (
            <JogoCard
              key={jogo.id}
              jogo={jogo}
              ordem={idx + 1}
              palpiteSelecionado={palpites[jogo.id] ?? null}
              onSelect={(p) => selecionar(jogo.id, p)}
              disabled={loading}
            />
          ))}
        </div>

        {/* Dados do apostador */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Seus dados</h2>
          <div className="space-y-3">
            <Input
              label="Nome completo"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="João da Silva"
              disabled={loading}
            />
            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
            />
            <Input
              label="WhatsApp / Telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              hint="Opcional — usado para contato sobre o pagamento"
              disabled={loading}
            />
          </div>
        </div>

        {erro && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{erro}</p>
          </div>
        )}
      </div>

      {/* Barra fixa de submissão */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-2xl z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase font-bold">Total</div>
            <div className="text-lg font-bold text-gray-900">
              {formatBRL(bolao.valor_cota)}
            </div>
          </div>
          <Button
            size="lg"
            onClick={submeter}
            loading={loading}
            disabled={!completo || loading}
            className="flex-1 max-w-xs"
          >
            <Send className="h-4 w-4" />
            Registrar meu palpite
          </Button>
        </div>
      </div>

      {/* Modal de sucesso */}
      <Modal
        open={!!resultado}
        onClose={() => router.push(`/cota/${resultado?.aposta_id}`)}
        title="✅ Palpite registrado!"
        size="lg"
      >
        {resultado && (
          <CotaComprovante
            numeroCota={resultado.numero_cota}
            apostaId={resultado.aposta_id}
            linkCota={resultado.link_cota}
            bolao={bolao}
            apostador={{ nome, email, telefone }}
            palpites={Object.entries(palpites).map(([jogo_id, palpite]) => ({ jogo_id, palpite }))}
          />
        )}
      </Modal>
    </>
  );
}

export function FormularioPalpite(props: Props) {
  return (
    <ToastProvider>
      <FormularioInterno {...props} />
    </ToastProvider>
  );
}
