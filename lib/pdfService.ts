import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ClosedMonth } from '../types';
// Fixed: parseISO should be imported from its own subpath if not available in main entry
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';

// Removed jspdf module augmentation as it was causing compilation issues.
// Using 'any' cast on the doc instance for accessing plugins like autotable.

export const generateClosingPDF = (data: ClosedMonth) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DRONEFLOW', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Fechamento Operacional', 20, 28);
  
  doc.setFontSize(14);
  doc.text(data.label.toUpperCase(), pageWidth - 20, 25, { align: 'right' });

  // Resumo Financeiro
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text('Resumo do Período', 20, 55);
  
  const summaryData = [
    ['Indicador', 'Valor'],
    ['Hectares Totais', `${data.hectares.toLocaleString()} ha`],
    ['Faturamento Bruto', `R$ ${data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Custos Totais', `R$ ${data.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Resultado Líquido', `R$ ${data.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
  ];

  doc.autoTable({
    startY: 60,
    head: [summaryData[0]],
    body: summaryData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] }, // emerald-500
    styles: { fontSize: 11 }
  });

  // Divisão de Sócios
  doc.setFontSize(16);
  doc.text('Partilha de Lucros', 20, doc.lastAutoTable.finalY + 15);

  const partnerData = data.partnerSummaries.map(p => [
    p.name,
    `R$ ${p.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `- R$ ${p.deductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    p.salary ? `R$ ${p.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '---',
    `R$ ${(p.netProfit + (p.salary || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Sócio', 'Cota 25%', 'Dedução', 'Pró-labore', 'Total']],
    body: partnerData,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85] }, // slate-700
    styles: { fontSize: 10 }
  });

  // Listagem de Serviços
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Detalhamento de Serviços', 20, 20);

  const servicesData = data.services.map(s => [
    format(parseISO(s.date), 'dd/MM/yy'),
    s.clientName,
    s.areaName,
    `${s.hectares} ha`,
    `R$ ${s.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  doc.autoTable({
    startY: 25,
    head: [['Data', 'Cliente', 'Área', 'Tamanho', 'Valor Total']],
    body: servicesData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 9 }
  });

  // Footer em todas as páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em: ${new Date().toLocaleString()} - DroneFlow Agriculture Systems`, 20, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, doc.internal.pageSize.height - 10, { align: 'right' });
  }

  doc.save(`Relatorio_DroneFlow_${data.monthYear.replace('/', '-')}.pdf`);
};
