
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ClosedMonth } from '../types';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { ptBR } from 'date-fns/locale/pt-BR';

export const generateClosingPDF = (data: ClosedMonth) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.width;

  const formatHectares = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    ['Hectares Totais', `${formatHectares(data.hectares)} ha`],
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

  // Footer em todas as páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado em: ${new Date().toLocaleString()} - DroneFlow Agriculture`, 20, doc.internal.pageSize.height - 10);
  }

  doc.save(`Relatorio_DroneFlow_${data.monthYear.replace('/', '-')}.pdf`);
};

export const generateAIReportPDF = (data: any) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(15, 23, 42); 
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DRONEFLOW AI', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Técnico de Compatibilidade de Calda UBV', 20, 35);
  
  doc.setFontSize(12);
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 20, 25, { align: 'right' });

  // Parâmetros Operacionais
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.text('Parâmetros da Operação', 20, 60);
  
  const paramsData = [
    ['Parâmetro', 'Valor'],
    ['Área Total', `${data.params.hectares} ha`],
    ['Vazão do Drone', `${data.params.flowRate} L/ha`],
    ['Capacidade Misturador', `${data.params.tankSize} Litros`]
  ];

  doc.autoTable({
    startY: 65,
    head: [paramsData[0]],
    body: paramsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10 }
  });

  // Produtos
  doc.text('Composição da Receita', 20, doc.lastAutoTable.finalY + 15);
  const productsData = data.products.map((p: any) => [
    p.name,
    p.type === 'liquid' ? 'Líquido' : 'Sólido/Pó',
    `${p.dosage} p/ ha`
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Produto', 'Tipo/Formulação', 'Dose']],
    body: productsData,
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85] }
  });

  // Resultado AI
  const statusColor = data.analysis.status === 'SAFE' ? [16, 185, 129] : data.analysis.status === 'CAUTION' ? [245, 158, 11] : [220, 38, 38];
  
  doc.setFillColor(...statusColor);
  doc.rect(20, doc.lastAutoTable.finalY + 10, pageWidth - 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`STATUS: ${data.analysis.status} - ${data.analysis.statusText}`, pageWidth / 2, doc.lastAutoTable.finalY + 20, { align: 'center' });

  // Análise Técnica
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text('Parecer Técnico do Agrônomo', 20, doc.lastAutoTable.finalY + 40);
  
  const splitText = doc.splitTextToSize(data.analysis.content, pageWidth - 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(splitText, 20, doc.lastAutoTable.finalY + 50);

  // Ordem de Mistura
  if (data.analysis.mixingOrder) {
    const nextY = doc.lastAutoTable.finalY + 55 + (splitText.length * 5);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ordem Recomendada de Entrada', 20, nextY > 260 ? 20 : nextY);
    if (nextY > 260) doc.addPage();
    
    const orderText = doc.splitTextToSize(data.analysis.mixingOrder, pageWidth - 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(orderText, 20, nextY > 260 ? 30 : nextY + 10);
  }

  doc.save(`DroneFlow_Analise_Calda_${new Date().getTime()}.pdf`);
};
