'use client';

import { Copy, Download, Share2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { BolaoComJogos, Palpite } from '@/types';
import { formatBRL } from '@/lib/utils';

interface Props {
  numeroCota: string;
  apostaId: string;
  linkCota: string;
  bolao: BolaoComJogos;
  apostador: { nome: string; email: string; telefone?: string };
  palpites: Palpite[];
}

const palpiteLabel: Record<string, string> = {
  casa: 'Casa',
  empate: 'Empate',
  fora: 'Fora',
};

export function CotaComprovante({ numeroCota, apostaId, linkCota, bolao, apostador, palpites }: Props) {
  const toast = useToast();
  const [copiando, setCopiando] = useState(false);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP;
  const pixChave = process.env.NEXT_PUBLIC_PIX_CHAVE;
  const pixNome = process.env.NEXT_PUBLIC_PIX_NOME;
  const pixBanco = process.env.NEXT_PUBLIC_PIX_BANCO;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkCota);
      setCopiando(true);
      toast.show('Link copiado!', 'success');
      setTimeout(() => setCopiando(false), 1500);
    } catch {
      toast.show('Não foi possível copiar', 'error');
    }
  }

  function compartilharWhats() {
    const texto = `Acabei de fazer meu palpite no bolão "${bolao.titulo}" 🏆\n\nMinha cota: ${numeroCota}\n${linkCota}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  }

  function baixarPDF() {
    window.open(`/api/cotas/${apostaId}`, '_blank');
  }

  return (
    <div className="space-y-5">
      {/* Bloco principal — número da cota */}
      <div className="bg-gradient-to-br from-brasil-verde to-brasil-verde-escuro rounded-xl p-5 text-white">
        <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Número da cota</div>
        <div className="text-4xl font-bold tabular-nums">{numeroCota}</div>
        <div className="mt-2 text-sm opacity-90">{bolao.titulo}</div>
      </div>

      {/* Dados do apostador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Apostador</div>
          <div className="font-semibold text-gray-900">{apostador.nome}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">E-mail</div>
          <div className="font-semibold text-gray-900">{apostador.email}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Valor</div>
          <div className="font-semibold text-gray-900">{formatBRL(bolao.valor_cota)}</div>
        </div>
        <div>
          <div className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Status</div>
          <div className="font-semibold text-amber-700">⏳ Pagamento pendente</div>
        </div>
      </div>

      {/* Instruções de pagamento */}
      {(pixChave || pixNome) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
          <h3 className="font-bold text-amber-900 mb-2">💳 Instruções de pagamento</h3>
          <div className="space-y-1 text-sm text-amber-900">
            <p>Faça um Pix de <strong>{formatBRL(bolao.valor_cota)}</strong> para confirmar sua cota:</p>
            {pixChave && <p>Chave Pix: <strong className="font-mono">{pixChave}</strong></p>}
            {pixNome && <p>Favorecido: <strong>{pixNome}</strong></p>}
            {pixBanco && <p>Banco: <strong>{pixBanco}</strong></p>}
            <p className="text-xs mt-2 text-amber-700">
              Após o pagamento, envie o comprovante para o organizador. Sua cota será confirmada no painel.
            </p>
          </div>
        </div>
      )}

      {/* Palpites */}
      <div>
        <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Seus palpites</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {bolao.jogos.map((jogo, idx) => {
            const p = palpites.find((pp) => pp.jogo_id === jogo.id);
            return (
              <div
                key={jogo.id}
                className={`flex items-center justify-between px-3 py-2.5 text-sm ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <span className="text-gray-700">
                  <span className="text-gray-400 mr-1">{idx + 1}.</span>
                  {jogo.time_casa} × {jogo.time_fora}
                </span>
                <span className="font-bold text-brasil-verde">
                  {p ? palpiteLabel[p.palpite] : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" onClick={copiarLink}>
          <Copy className="h-4 w-4" />
          {copiando ? 'Copiado!' : 'Copiar link'}
        </Button>
        <Button variant="outline" onClick={baixarPDF}>
          <Download className="h-4 w-4" />
          PDF
        </Button>
        <Button variant="success" onClick={compartilharWhats} className="col-span-2">
          <MessageCircle className="h-4 w-4" />
          Compartilhar no WhatsApp
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center pt-2">
        Guarde este link para consultar sua cota a qualquer momento.
      </p>
    </div>
  );
}
