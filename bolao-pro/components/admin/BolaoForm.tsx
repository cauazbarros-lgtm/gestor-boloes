'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { JogosBuilder } from './JogosBuilder';
import { useToast } from '@/components/ui/Toast';
import type { Bolao, BolaoComJogos, JogoInput, StatusBolao } from '@/types';

interface Props {
  bolao?: BolaoComJogos | null; // se passado = modo edição
}

export function BolaoForm({ bolao }: Props) {
  const router = useRouter();
  const toast = useToast();
  const editando = !!bolao;

  const [titulo, setTitulo] = useState(bolao?.titulo ?? '');
  const [rodada, setRodada] = useState<number>(bolao?.rodada ?? 1);
  const [premio, setPremio] = useState<number>(bolao?.premio_acumulado ?? 0);
  const [valorCota, setValorCota] = useState<number>(bolao?.valor_cota ?? 20);
  const [dataLimite, setDataLimite] = useState(
    bolao?.data_limite ? new Date(bolao.data_limite).toISOString().slice(0, 16) : ''
  );
  const [descricao, setDescricao] = useState(bolao?.descricao ?? '');
  const [regras, setRegras] = useState(bolao?.regras ?? '');
  const [linkCheckout, setLinkCheckout] = useState(bolao?.link_checkout ?? '');
  const [status, setStatus] = useState<StatusBolao>(bolao?.status ?? 'aberto');
  const [jogos, setJogos] = useState<JogoInput[]>(
    bolao?.jogos?.map((j) => ({
      time_casa: j.time_casa,
      time_fora: j.time_fora,
      escudo_casa: j.escudo_casa,
      escudo_fora: j.escudo_fora,
      data_jogo: j.data_jogo,
      ordem: j.ordem,
    })) ?? []
  );

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    if (!titulo.trim()) return setErro('Informe o título.');
    if (!rodada || rodada < 1) return setErro('Rodada inválida.');
    if (!valorCota || valorCota < 0) return setErro('Valor da cota inválido.');
    if (jogos.length === 0) return setErro('Adicione pelo menos 1 jogo.');
    if (jogos.some((j) => !j.time_casa.trim() || !j.time_fora.trim())) {
      return setErro('Preencha os dois times de cada jogo.');
    }

    setLoading(true);
    try {
      const payload = {
        titulo,
        rodada,
        premio_acumulado: premio,
        valor_cota: valorCota,
        data_limite: dataLimite ? new Date(dataLimite).toISOString() : null,
        descricao,
        regras,
        link_checkout: linkCheckout?.trim() || null,
        status,
        jogos,
      };

      const url = editando ? `/api/boloes/${bolao!.id}` : '/api/boloes';
      const method = editando ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.erro ?? 'Erro ao salvar');
      }
      toast.show(editando ? 'Bolão atualizado!' : 'Bolão criado!', 'success');

      if (!editando && data.data?.slug) {
        router.push(`/admin/boloes/${data.data.id}?criado=1`);
      } else {
        router.push('/admin/boloes');
      }
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado';
      setErro(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Bloco — dados gerais */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-white">Dados gerais</h2>

        <Input
          label="Título do bolão"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Bolão Rodada 15 - Brasileirão 2025"
          className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Rodada"
            type="number"
            min={1}
            required
            value={rodada}
            onChange={(e) => setRodada(Number(e.target.value))}
            className="bg-admin-bg border-admin-border text-white"
          />
          <Input
            label="Prêmio acumulado (R$)"
            type="number"
            min={0}
            step={0.01}
            value={premio}
            onChange={(e) => setPremio(Number(e.target.value))}
            className="bg-admin-bg border-admin-border text-white"
          />
          <Input
            label="Valor da cota (R$)"
            type="number"
            min={0}
            step={0.01}
            required
            value={valorCota}
            onChange={(e) => setValorCota(Number(e.target.value))}
            className="bg-admin-bg border-admin-border text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Data limite para apostas"
            type="datetime-local"
            value={dataLimite}
            onChange={(e) => setDataLimite(e.target.value)}
            className="bg-admin-bg border-admin-border text-white"
          />
          {editando && (
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusBolao)}
                className="block w-full h-11 rounded-lg border border-admin-border bg-admin-bg px-3 text-white focus:outline-none focus:border-brasil-verde"
              >
                <option value="aberto">Aberto</option>
                <option value="encerrado">Encerrado</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>
          )}
        </div>

        <Input
          label="Link do checkout (opcional)"
          type="url"
          value={linkCheckout ?? ''}
          onChange={(e) => setLinkCheckout(e.target.value)}
          placeholder="https://safeflowapp.com/seu-checkout"
          hint="Quando preenchido, o botão 'Registrar meu palpite' redireciona o apostador pra essa URL após salvar o palpite. Deixe vazio pra usar o modal padrão."
          className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
        />

        <Textarea
          label="Descrição (opcional)"
          value={descricao ?? ''}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          placeholder="Breve descrição que aparece no topo da página pública"
          className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
        />

        <Textarea
          label="Regras (opcional)"
          value={regras ?? ''}
          onChange={(e) => setRegras(e.target.value)}
          rows={4}
          placeholder="Regras detalhadas do bolão"
          className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
        />
      </div>

      {/* Bloco — jogos */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5">
        <JogosBuilder jogos={jogos} onChange={setJogos} />
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={salvar} loading={loading} size="lg">
          <Save className="h-4 w-4" />
          {editando ? 'Salvar alterações' : 'Criar bolão'}
        </Button>
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:bg-admin-border">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
