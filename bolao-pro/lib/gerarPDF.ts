import jsPDF from 'jspdf';
import type { Aposta, BolaoComJogos } from '@/types';
import { formatBRL, formatDataHora } from './utils';

/**
 * Monta o PDF e devolve a instância jsPDF.
 * As funções públicas abaixo chamam `output()` com o formato desejado.
 */
function montarPDF(aposta: Aposta, bolao: BolaoComJogos): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Cabeçalho — barra verde + amarela
  doc.setFillColor(0, 156, 59);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setFillColor(255, 223, 0);
  doc.rect(0, 12, pageWidth, 2, 'F');

  // Título
  y = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 120, 45);
  doc.text('BolaoPro', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprovante de Cota', pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(0, 156, 59);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Bloco do bolão
  y += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(bolao.titulo, margin, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Rodada ${bolao.rodada}`, margin, y);
  doc.text(`Valor da cota: ${formatBRL(bolao.valor_cota)}`, pageWidth - margin, y, {
    align: 'right',
  });

  // Número da cota em destaque
  y += 12;
  doc.setFillColor(0, 156, 59);
  doc.rect(margin, y, pageWidth - margin * 2, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('NUMERO DA COTA', margin + 5, y + 7);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(aposta.numero_cota, margin + 5, y + 15);

  // Dados do apostador
  y += 26;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Apostador', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${aposta.nome_apostador}`, margin, y);
  y += 5;
  doc.text(`E-mail: ${aposta.email_apostador}`, margin, y);
  if (aposta.telefone_apostador) {
    y += 5;
    doc.text(`Telefone: ${aposta.telefone_apostador}`, margin, y);
  }
  y += 5;
  doc.text(`Registrado em: ${formatDataHora(aposta.criado_em)}`, margin, y);

  // Status do pagamento
  y += 10;
  const statusLabel: Record<string, string> = {
    pendente: 'PAGAMENTO PENDENTE',
    confirmado: 'PAGAMENTO CONFIRMADO',
    cancelado: 'CANCELADO',
  };
  const cor: Record<string, [number, number, number]> = {
    pendente: [235, 165, 35],
    confirmado: [0, 156, 59],
    cancelado: [200, 50, 50],
  };
  const c = cor[aposta.status_pagamento] || [120, 120, 120];
  doc.setFillColor(c[0], c[1], c[2]);
  doc.rect(margin, y, 80, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel[aposta.status_pagamento] || '-', margin + 3, y + 5.5);

  // Tabela de palpites
  y += 16;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Seus palpites', margin, y);

  y += 6;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('#', margin + 3, y + 5);
  doc.text('Jogo', margin + 12, y + 5);
  doc.text('Palpite', pageWidth - margin - 30, y + 5);
  if (bolao.status === 'finalizado') {
    doc.text('Resultado', pageWidth - margin - 8, y + 5, { align: 'right' });
  }

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  const palpiteLabel: Record<string, string> = {
    casa: 'Casa',
    empate: 'Empate',
    fora: 'Fora',
  };

  bolao.jogos.forEach((jogo, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const palpite = aposta.palpites.find((p) => p.jogo_id === jogo.id);
    doc.text(`${idx + 1}`, margin + 3, y);
    doc.text(`${jogo.time_casa} x ${jogo.time_fora}`, margin + 12, y);
    doc.text(palpite ? palpiteLabel[palpite.palpite] : '-', pageWidth - margin - 30, y);
    if (bolao.status === 'finalizado' && jogo.resultado) {
      const acertou = palpite?.palpite === jogo.resultado;
      doc.setTextColor(acertou ? 0 : 200, acertou ? 156 : 50, acertou ? 59 : 50);
      doc.text(
        `${palpiteLabel[jogo.resultado]} ${acertou ? 'OK' : 'X'}`,
        pageWidth - margin - 8,
        y,
        { align: 'right' }
      );
      doc.setTextColor(40, 40, 40);
    }
    y += 6;
  });

  // Resumo final se finalizado
  if (bolao.status === 'finalizado' && aposta.acertos !== null) {
    y += 4;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, pageWidth - margin * 2, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(`Total de acertos: ${aposta.acertos} de ${bolao.jogos.length}`, margin + 3, y + 6);
    if (aposta.ganhador) {
      doc.setTextColor(0, 156, 59);
      doc.text('GANHADOR!', margin + 3, y + 11);
    }
  }

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Guarde este comprovante. Em caso de duvidas, entre em contato com o organizador.',
    pageWidth / 2,
    285,
    { align: 'center' }
  );
  doc.text(`Cota: ${aposta.numero_cota}`, pageWidth / 2, 290, { align: 'center' });

  return doc;
}

/**
 * Gera o PDF como Blob (uso no browser / download client-side).
 */
export function gerarPDFComprovante(aposta: Aposta, bolao: BolaoComJogos): Blob {
  return montarPDF(aposta, bolao).output('blob');
}

/**
 * Gera o PDF como ArrayBuffer (uso em route handlers / server).
 */
export function gerarPDFComprovanteBuffer(aposta: Aposta, bolao: BolaoComJogos): ArrayBuffer {
  return montarPDF(aposta, bolao).output('arraybuffer');
}
