'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Placar, StatusBolao } from '@/types';

interface Props {
  placar?: Placar | null;
}

export function PlacarForm({ placar }: Props) {
  const router = useRouter();
  const toast = useToast();
  const editando = !!placar;

  const [titulo, setTitulo] = useState(placar?.titulo ?? '');
  const [timeCasa, setTimeCasa] = useState(placar?.time_casa ?? '');
  const [timeFora, setTimeFora] = useState(placar?.time_fora ?? '');
  const [escudoCasa, setEscudoCasa] = useState(placar?.escudo_casa ?? '');
  const [escudoFora, setEscudoFora] = useState(placar?.escudo_fora ?? '');
  const [premio, setPremio] = useState<number>(placar?.premio_acumulado ?? 0);
  const [valorCota, setValorCota] = useState<number>(placar?.valor_cota ?? 10);
  const [dataJogo, setDataJogo] = useState(
    placar?.data_jogo ? new Date(placar.data_jogo).toISOString().slice(0, 16) : ''
  );
  const [linkCheckout, setLinkCheckout] = useState(placar?.link_checkout ?? '');
  const [descricao, setDescricao] = useState(placar?.descricao ?? '');
  const [regras, setRegras] = useState(placar?.regras ?? '');
  const [status, setStatus] = useState<StatusBolao>(placar?.status ?? 'aberto');
  const [golsCasa, setGolsCasa] = useState<number | ''>(placar?.gols_casa ?? '');
  const [golsFora, setGolsFora] = useState<number | ''>(placar?.gols_fora ?? '');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    if (!titulo.trim()) return setErro('Informe o título.');
    if (!timeCasa.trim() || !timeFora.trim()) return setErro('Informe os dois times.');
    if (!valorCota || valorCota < 0) return setErro('Valor da cota inválido.');

    setLoading(true);
    try {
      const payload = {
        titulo,
        time_casa: timeCasa,
        time_fora: timeFora,
        escudo_casa: escudoCasa?.trim() || null,
        escudo_fora: escudoFora?.trim() || null,
        data_jogo: dataJogo ? new Date(dataJogo).toISOString() : null,
        premio_acumulado: premio,
        valor_cota: valorCota,
        link_checkout: linkCheckout?.trim() || null,
        descricao,
        regras,
        status,
        gols_casa: golsCasa === '' ? null : Number(golsCasa),
        gols_fora: golsFora === '' ? null : Number(golsFora),
      };

      const url = editando ? `/api/placares/${placar!.id}` : '/api/placares';
      const method = editando ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.sucesso) throw new Error(data.erro ?? 'Erro ao salvar');

      toast.show(editando ? 'Placar atualizado!' : 'Placar criado!', 'success');
      if (!editando && data.data?.id) {
        router.push(`/admin/placares/${data.data.id}?criado=1`);
      } else {
        router.push('/admin/placares');
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
      <div className="bg-admin-surface border border-admin-border rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-white">Dados do jogo</h2>

        <Input
          label="Título"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Corinthians × São Paulo — Brasileirão"
          className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Time da casa"
            required
            value={timeCasa}
            onChange={(e) => setTimeCasa(e.target.value)}
            placeholder="Corinthians"
            className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
          />
          <Input
            label="Time visitante"
            required
            value={timeFora}
            onChange={(e) => setTimeFora(e.target.value)}
            placeholder="São Paulo"
            className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
          />
          <Input
            label="Escudo casa (URL opcional)"
            value={escudoCasa}
            onChange={(e) => setEscudoCasa(e.target.value)}
            placeholder="https://..."
            className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
          />
          <Input
            label="Escudo fora (URL opcional)"
            value={escudoFora}
            onChange={(e) => setEscudoFora(e.target.value)}
            placeholder="https://..."
            className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Prêmio (R$)"
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
          <Input
            label="Data e hora do jogo"
            type="datetime-local"
            value={dataJogo}
            onChange={(e) => setDataJogo(e.target.value)}
            className="bg-admin-bg border-admin-border text-white"
          />
        </div>

        {editando && (
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusBolao)}
              className="block w-full h-11 rounded-lg border border-admin-border bg-admin-bg px-3 text-white"
            >
              <option value="aberto">Aberto</option>
              <option value="encerrado">Encerrado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        )}

        <Input
          label="Link do checkout (opcional)"
          type="url"
          value={linkCheckout ?? ''}
          onChange={(e) => setLinkCheckout(e.target.value)}
          placeholder="https://safeflowapp.com/seu-checkout"
          hint="Quando preenchido, o botão 'Registrar meu palpite' redireciona pra essa URL após salvar o palpite."
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
          rows={3}
          placeholder="Regras detalhadas do palpite"
          className="bg-admin-bg border-admin-border text-white placeholder:text-gray-500"
        />
      </div>

      {/* Resultado final (só em modo edição) */}
      {editando && (
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-bold text-white">Resultado final do jogo</h2>
            <p className="text-xs text-gray-400 mt-1">
              Preencha após o jogo terminar. Apostadores que acertarem o placar exato serão marcados como ganhadores automaticamente.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Gols ${timeCasa || 'Casa'}`}
              type="number"
              min={0}
              max={20}
              value={golsCasa}
              onChange={(e) => setGolsCasa(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Deixe vazio se ainda não jogou"
              className="bg-admin-bg border-admin-border text-white"
            />
            <Input
              label={`Gols ${timeFora || 'Fora'}`}
              type="number"
              min={0}
              max={20}
              value={golsFora}
              onChange={(e) => setGolsFora(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Deixe vazio se ainda não jogou"
              className="bg-admin-bg border-admin-border text-white"
            />
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {erro}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={salvar} loading={loading} size="lg">
          <Save className="h-4 w-4" />
          {editando ? 'Salvar alterações' : 'Criar placar'}
        </Button>
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:bg-admin-border">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
