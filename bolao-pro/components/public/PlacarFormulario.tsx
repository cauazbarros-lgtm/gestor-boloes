'use client';

import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import type { Placar } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SeletorGols } from './SeletorGols';
import { useToast, ToastProvider } from '@/components/ui/Toast';
import { formatBRL, prazoExpirado } from '@/lib/utils';

interface Props {
  placar: Placar;
}

function FormularioInterno({ placar }: Props) {
  const toast = useToast();
  const [golsCasa, setGolsCasa] = useState(0);
  const [golsFora, setGolsFora] = useState(0);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ numero_cota: string; palpite_id: string } | null>(null);

  const apostasEncerradas =
    placar.status !== 'aberto' || prazoExpirado(placar.data_jogo);

  async function submeter() {
    setErro(null);
    if (!nome.trim() || !email.trim()) {
      setErro('Preencha seu nome e e-mail.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErro('E-mail inválido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/palpites-placar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placar_id: placar.id,
          nome_apostador: nome,
          email_apostador: email,
          telefone_apostador: telefone || null,
          gols_casa_palpite: golsCasa,
          gols_fora_palpite: golsFora,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro ?? 'Erro ao registrar palpite');
      }

      // Se tem link de checkout, redireciona
      if (placar.link_checkout) {
        toast.show('Palpite registrado! Redirecionando pro checkout...', 'success');
        const url = new URL(placar.link_checkout);
        url.searchParams.set('palpite_id', data.palpite_id);
        url.searchParams.set('cota', data.numero_cota);
        url.searchParams.set('nome', nome);
        url.searchParams.set('email', email);
        if (telefone) url.searchParams.set('telefone', telefone);
        url.searchParams.set('valor', String(placar.valor_cota));
        url.searchParams.set('jogo', `${placar.time_casa} x ${placar.time_fora}`);
        url.searchParams.set('palpite', `${golsCasa}-${golsFora}`);
        setTimeout(() => {
          window.location.href = url.toString();
        }, 800);
        return;
      }

      setResultado({ numero_cota: data.numero_cota, palpite_id: data.palpite_id });
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
          <h2 className="text-xl font-bold text-amber-900 mb-1">Palpites encerrados</h2>
          <p className="text-amber-800">Este jogo não está mais aceitando palpites.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-32">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">Seu palpite</h2>
          <p className="text-sm text-gray-600">
            Qual será o <strong>placar exato</strong> do jogo? Use os botões + e − para escolher os gols de cada time.
          </p>
        </div>

        {/* Seletor de gols */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <SeletorGols
              label={placar.time_casa}
              escudo={placar.escudo_casa}
              value={golsCasa}
              onChange={setGolsCasa}
              disabled={loading}
            />
            <div className="flex flex-col items-center justify-center pt-12">
              <span className="text-2xl font-bold text-gray-400">×</span>
            </div>
            <SeletorGols
              label={placar.time_fora}
              escudo={placar.escudo_fora}
              value={golsFora}
              onChange={setGolsFora}
              disabled={loading}
            />
          </div>

          {/* Resumo do palpite */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                Seu palpite
              </div>
              <div className="text-3xl font-bold text-brasil-verde tabular-nums">
                {placar.time_casa} {golsCasa} × {golsFora} {placar.time_fora}
              </div>
            </div>
          </div>
        </div>

        {/* Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
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
              hint="Opcional — usado para contato sobre o prêmio"
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

      {/* Barra fixa */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-2xl z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase font-bold">Total</div>
            <div className="text-lg font-bold text-gray-900">{formatBRL(placar.valor_cota)}</div>
          </div>
          <Button size="lg" onClick={submeter} loading={loading} className="flex-1 max-w-xs">
            <Send className="h-4 w-4" /> Registrar meu palpite
          </Button>
        </div>
      </div>

      {/* Modal de sucesso (só quando não tem link_checkout) */}
      <Modal
        open={!!resultado}
        onClose={() => setResultado(null)}
        title="✅ Palpite registrado!"
        size="md"
      >
        {resultado && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-brasil-verde to-brasil-verde-escuro rounded-xl p-5 text-white">
              <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Número da cota</div>
              <div className="text-4xl font-bold tabular-nums">{resultado.numero_cota}</div>
              <div className="mt-2 text-sm opacity-90">{placar.titulo}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                Seu palpite
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {placar.time_casa} {/* gols casa */}
                <span className="text-brasil-verde mx-2 tabular-nums">{golsCasa}</span>
                ×
                <span className="text-brasil-verde mx-2 tabular-nums">{golsFora}</span>
                {placar.time_fora}
              </div>
            </div>
            <div className="text-sm text-gray-600 text-center">
              Guarde sua cota: <strong>{resultado.numero_cota}</strong>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export function PlacarFormulario(props: Props) {
  return (
    <ToastProvider>
      <FormularioInterno {...props} />
    </ToastProvider>
  );
}
