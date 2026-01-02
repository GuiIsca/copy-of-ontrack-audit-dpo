import { Audit, AuditScore, User } from '../types';

// Declarar html2pdf como disponível no window
declare global {
  interface Window {
    html2pdf: any;
  }
}

export const exportAuditToPDF = async (
  audit: Audit,
  store: any,
  checklistData: any,
  allUsers: User[],
  scores: AuditScore[] = [],
  actions?: any[],
  comments?: any[],
  scoresBySection?: any[],
  options?: {
    hideSummary?: boolean;
    hideComments?: boolean;
    hideUnscoredBadges?: boolean;
    hideSectionEvaluations?: boolean;
  }
) => {
  // Usar html2pdf do window (carregado via CDN)
  const html2pdf = window.html2pdf;
  if (!html2pdf) {
    throw new Error('Gerador de PDF não encontrado (html2pdf).');
  }

  const getUserName = (userId: any): string => {
    if (!userId) return 'Desconhecido';
    const user = allUsers.find(u => u.id === userId);
    return user ? user.fullname : 'Desconhecido';
  };

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const storeNumber = store?.numero || 'N/A';
  const storeName = store?.nome || 'Loja Desconhecida';
  const auditDate = formatDate(audit.dtstart);
  const storeCity = store?.distrito || '-';
  const storeArea = store?.area || '-';

  const normalizeRatingValue = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.includes('/')) {
        const [first] = trimmed.split('/');
        const n = Number(first);
        return Number.isNaN(n) ? null : n;
      }
      const n = Number(trimmed.replace(',', '.'));
      return Number.isNaN(n) ? null : n;
    }
    if (typeof val === 'number') return val;
    return null;
  };

  const normalizedSectionEvals = (scoresBySection || []).map((s: any) => ({
    ...s,
    section_id: s.section_id ?? s.sectionId ?? (s as any).sectionid ?? (s as any).section,
    rating: normalizeRatingValue(s.rating ?? s.rating_value ?? s.ratingValue ?? s.rating_score ?? s.ratingScore),
    percentage_filled: s.percentage_filled ?? s.percentageFilled
  }));

  const getSectionRating = (sectionId: any): number | null => {
    const matches = normalizedSectionEvals.filter((s: any) => {
      const sid = String(s.section_id);
      const target = String(sectionId);
      return sid === target || sid.startsWith(target + '_');
    });
    if (matches.length === 0) return null;

    const ratings = matches
      .map((m: any) => {
        if (m.rating !== undefined && m.rating !== null) return m.rating;
        if (m.percentage_filled !== undefined && m.percentage_filled !== null) {
          return (Number(m.percentage_filled) / 100) * 5;
        }
        return null;
      })
      .filter((r: number | null) => r !== null && r !== undefined && !Number.isNaN(r));

    if (ratings.length === 0) return 0; // Secção avaliada mas sem nota explícita: mostrar 0
    const total = ratings.reduce((sum: number, r: number | null) => sum + (r || 0), 0);
    return total / ratings.length;
  };

  const sectionRatings = (checklistData?.sections || []).map((section: any) => ({
    id: section.id,
    name: section.name,
    rating: getSectionRating(section.id)
  })).filter((s: any) => s.rating !== null && s.rating !== undefined);

  const totalScaleRating = sectionRatings.length > 0
    ? sectionRatings.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / sectionRatings.length
    : (audit.score ? (Number(audit.score) / 100) * 5 : null);

  const formatRating = (rating: number | null | undefined): string => {
    if (rating === null || rating === undefined) return 'N/A';
    const fixed = Number(rating);
    return fixed % 1 === 0 ? fixed.toFixed(0) : fixed.toFixed(1);
  };

  // Construir seções com critérios
  const sectionsHTML = (checklistData?.sections || [])
    .map((section: any) => {
      const sectionEval = scoresBySection?.find((s: any) => String(s.section_id) === String(section.id));

      const criteriaBlocksHTML = (section.items || [])
        .map((item: any) => {
          const criteriaHTML = (item.criteria || [])
            .map((criteria: any) => {
              const score = scores.find((s: any) => String(s.criteria_id) === String(criteria.id));
              const rawScore = score?.score;
              const hasScore = rawScore === 0 || rawScore === 1 || (rawScore !== null && rawScore !== undefined);
              const forceScale15 = (criteria?.evaluation_type === 'SCALE_1_5') || (criteria as any)?.type === 'rating';
              const isOkKo = !forceScale15 && (rawScore === 0 || rawScore === 1);
              const isScale15 = forceScale15 || (hasScore && !isOkKo);
              const scaleColors: Record<number, string> = {
                1: '#dc2626', // red
                2: '#ea580c', // orange
                3: '#eab308', // yellow
                4: '#84cc16', // lime
                5: '#16a34a'  // green
              };
              const shouldHideBadge = options?.hideUnscoredBadges && !hasScore;
              const scoreLabel = isScale15
                ? `${rawScore}/5`
                : rawScore === 1 ? '✓ OK'
                : rawScore === 0 ? '✗ KO'
                : options?.hideUnscoredBadges ? '' : 'Não avaliado';
              const scoreBg = isScale15
                ? '#e0f2fe'
                : rawScore === 1 ? '#d1fae5'
                : rawScore === 0 ? '#fee2e2'
                : '#f3f4f6';
              const scoreColor = isScale15
                ? scaleColors[Number(rawScore)] || '#0ea5e9'
                : rawScore === 1 ? '#059669'
                : rawScore === 0 ? '#dc2626'
                : '#6b7280';

              return `
                <div style="
                  margin: 12px 0;
                  padding: 12px;
                  background-color: #f9fafb;
                  border-left: 4px solid #dc2626;
                  border-radius: 4px;
                  page-break-inside: avoid;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1; font-size: 14px; color: #374151;">
                      <strong>${criteria.name}</strong>
                    </div>
                    ${shouldHideBadge ? '' : `
                      <div style="
                        background-color: ${scoreBg};
                        color: ${scoreColor};
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 12px;
                        margin-left: 12px;
                      ">
                        ${scoreLabel}
                      </div>
                    `}
                  </div>
                  ${
                    score?.comment
                      ? `<div style="
                          margin-top: 8px;
                          font-size: 12px;
                          color: #6b7280;
                          border-top: 1px solid #e5e7eb;
                          padding-top: 8px;
                        ">
                          <strong>Comentário:</strong> ${score.comment}
                        </div>`
                      : ''
                  }
                </div>
              `;
            })
            .join('');

          return `
            <div style="margin: 16px 0; margin-left: 20px; page-break-inside: avoid;">
              <h5 style="font-size: 13px; font-weight: bold; color: #1f2937; margin: 8px 0;">
                ${item.name}
              </h5>
              ${criteriaHTML}
            </div>
          `;
        })
        .join('');

      // Wrapper de toda a secção: título + avaliação + plano de ação + todos os itens
      return `
        <div style="margin: 24px 0; page-break-inside: avoid;">
          <h4 style="
            font-size: 16px;
            font-weight: bold;
            color: #dc2626;
            border-bottom: 2px solid #dc2626;
            padding-bottom: 8px;
            margin: 0 0 16px 0;
            page-break-after: avoid;
          ">
            ${section.name}
          </h4>

          ${
            !options?.hideSectionEvaluations && sectionEval && sectionEval.rating !== undefined && sectionEval.rating !== null
              ? `<div style="
                  margin: 12px 0;
                  padding: 10px;
                  background-color: #f3f4f6;
                  border-radius: 4px;
                  font-size: 13px;
                  page-break-inside: avoid;
                ">
                  <strong>Avaliação da Secção:</strong>
                  <span style="
                    background-color: #4b5563;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-weight: bold;
                    margin-left: 8px;
                  ">
                    ${sectionEval.rating}/5
                  </span>
                </div>`
              : ''
          }

          ${
            !options?.hideSectionEvaluations && sectionEval?.action_plan
              ? `<div style="
                  margin: 8px 0 16px 0;
                  padding: 10px;
                  background-color: #fef9c3;
                  border-radius: 4px;
                  font-size: 13px;
                  color: #92400e;
                  border-left: 4px solid #f59e42;
                  page-break-inside: avoid;
                ">
                  <strong>Plano de Ação:</strong> ${sectionEval.action_plan}
                </div>`
              : ''
          }

          <div style="page-break-inside: avoid;">
            ${criteriaBlocksHTML}
          </div>
        </div>
      `;
    })
    .join('');

  const normalizedActions = (actions || []).map(action => ({
    ...action,
    dueDate: action.dueDate || (action as any).due_date,
    responsible_user_id: action.responsible_user_id || (action as any).responsibleUserId,
    status: action.status,
    completedDate: action.completedDate || (action as any).completed_date
  }));

  // Construir lista de ações
  const actionsListHTML = normalizedActions
    .map(action => `
      <li>
        <strong>${action.title || 'Sem título'}</strong><br/>
        <small>Responsável: ${getUserName(action.responsible_user_id)}</small><br/>
        <small>Data Limite: ${formatDate(action.dueDate)}</small><br/>
        <small>Status: <strong>${action.status || 'Pendente'}</strong></small><br/>
        <p>${action.description || ''}</p>
      </li>
    `)
    .join('');

  const normalizedComments = (comments || []).map(comment => ({
    user_id: (comment as any).user_id || (comment as any).userId,
    created_at: (comment as any).created_at || (comment as any).timestamp || (comment as any).createdAt,
    text: (comment as any).text || (comment as any).comment || (comment as any).content || ''
  }));

  // Construir lista de comentários
  const commentsListHTML = normalizedComments
    .map(comment => `
      <div class="comment-item">
        <strong>${getUserName(comment.user_id)}</strong><br/>
        <small>${formatDate(comment.created_at)}</small><br/>
        <p>${comment.text}</p>
      </div>
    `)
    .join('');

  const summaryFields = {
    pontosFortes: (audit as any).pontos_fortes || (audit as any).pontosFortes,
    pontosMelhorar: (audit as any).pontos_melhorar || (audit as any).pontosMelhorar,
    acoesCriticas: (audit as any).acoes_criticas || (audit as any).acoesCriticas,
    alertas: (audit as any).alertas || (audit as any).alertas
  };

  const summaryHTML = options?.hideSummary ? '' :
    (summaryFields.pontosFortes || summaryFields.pontosMelhorar || summaryFields.acoesCriticas || summaryFields.alertas || totalScaleRating !== null) ? `
      <div class="section">
        <h2>Resumo Final da Auditoria</h2>
        ${totalScaleRating !== null ? `
          <div style="margin-bottom: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #374151;">Nota Final Global</span>
              <span style="font-size: 22px; font-weight: 700; color: #dc2626;">${formatRating(totalScaleRating)}/5</span>
            </div>
          </div>
        ` : ''}

        ${sectionRatings.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Notas por Secção</h4>
            ${sectionRatings.map((s: any) => `
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                <span style="color: #4b5563;">${s.name}</span>
                <span style="font-weight: 700; color: ${s.rating < 2.5 ? '#dc2626' : s.rating < 4 ? '#d97706' : '#16a34a'};">${formatRating(s.rating)}/5</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${summaryFields.pontosFortes ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px;">Pontos Fortes</h4>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 13px; color: #334155; white-space: pre-line;">${summaryFields.pontosFortes}</div>
          </div>
        ` : ''}

        ${summaryFields.pontosMelhorar ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px;">Pontos a Melhorar</h4>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 13px; color: #334155; white-space: pre-line;">${summaryFields.pontosMelhorar}</div>
          </div>
        ` : ''}

        ${summaryFields.acoesCriticas ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px;">Ações Críticas</h4>
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px; font-size: 13px; color: #9a3412; white-space: pre-line;">${summaryFields.acoesCriticas}</div>
          </div>
        ` : ''}

        ${summaryFields.alertas ? `
          <div style="margin-bottom: 4px;">
            <h4 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 6px;">Alertas</h4>
            <div style="background: #fef2f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px; font-size: 13px; color: #b91c1c; white-space: pre-line;">${summaryFields.alertas}</div>
          </div>
        ` : ''}
      </div>
    ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background-color: white;
        }

        /* IMPORTANTE: não usar * { page-break-inside: avoid } */

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 4px solid #dc2626;
          padding-bottom: 20px;
          page-break-inside: avoid;
        }

        .header h1 {
          margin: 0;
          color: #dc2626;
          font-size: 28px;
        }

        .header p {
          margin: 8px 0;
          font-size: 14px;
          color: #666;
        }

        .section {
          margin-bottom: 40px;
          padding: 20px;
          page-break-inside: avoid;
          page-break-before: auto;
        }

        .section h2 {
          color: #dc2626;
          border-bottom: 2px solid #dc2626;
          padding-bottom: 10px;
          font-size: 18px;
          margin: 0 0 20px 0;
          page-break-after: avoid;
        }

        .general-data {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 10px;
          border-left: 4px solid #dc2626;
          page-break-inside: avoid;
        }

        .general-data p {
          margin: 8px 0;
          font-size: 14px;
        }

        .general-data strong {
          color: #333;
        }

        ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }

        li {
          margin-bottom: 15px;
          padding: 12px;
          background-color: #fafafa;
          border-left: 4px solid #10b981;
          border-radius: 3px;
          font-size: 13px;
          page-break-inside: avoid;
        }

        li strong {
          color: #333;
        }

        li small {
          color: #666;
          display: block;
          margin-top: 4px;
        }

        li p {
          margin: 8px 0 0 0;
          color: #555;
        }

        .final-score {
          font-size: 26px;
          font-weight: bold;
          color: #dc2626;
        }

        .comment-item {
          margin-bottom: 15px;
          padding: 12px;
          background-color: #f9f9f9;
          border-left: 3px solid #007bff;
          border-radius: 3px;
          font-size: 13px;
          page-break-inside: avoid;
        }

        .comment-item strong {
          color: #333;
        }

        .comment-item small {
          color: #666;
        }

        .comment-item p {
          margin-top: 8px;
          color: #333;
        }

        /* Se quiseres obrigar Resultados da Avaliação a começar numa nova página:
        .resultados-section {
          page-break-before: always;
        }
        */
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Auditoria</h1>
        <p><strong>${storeName}</strong></p>
        <p>Loja nº <strong>${storeNumber}</strong> | ${storeCity}</p>
        <p>Data da Auditoria: <strong>${auditDate}</strong></p>
      </div>

      <div class="section">
        <h2>Dados Gerais</h2>
        <div class="general-data">
          <p><strong>Loja:</strong> ${storeName}</p>
          <p><strong>Número da Loja:</strong> ${storeNumber}</p>
          <p><strong>Distrito:</strong> ${storeCity}</p>
          <p><strong>Área (m²):</strong> ${storeArea}</p>
          <p><strong>Data da Auditoria:</strong> ${auditDate}</p>
          <p><strong>Pontuação Final:</strong> <span class="final-score">${Math.round(audit.score || 0)}%</span></p>
        </div>
      </div>

      ${audit.auditorcomments ? `
        <div class="section">
          <h2>Observações Gerais do Auditor</h2>
          <div class="general-data" style="background-color: #f3f4f6; color: #374151;">
            <p style="white-space: pre-line;">${audit.auditorcomments}</p>
          </div>
        </div>
      ` : ''}

      <div class="section resultados-section">
        <h2>Resultados da Avaliação</h2>
        <div style="page-break-inside: avoid;">
          ${sectionsHTML}
        </div>
      </div>

      ${summaryHTML}

      ${
        actions && actions.length > 0
          ? `
        <div class="section">
          <h2>Ações</h2>
          <ul>
            ${actions.map(action => `
              <li>
                <strong>${action.title || 'Sem título'}</strong><br/>
                <div style="margin-top: 4px;">
                  <span style="margin-right: 12px;"><strong>Responsável:</strong> ${action.responsible || '-'}</span>
                  <span style="margin-right: 12px;"><strong>Prazo:</strong> ${action.dueDate ? formatDate(action.dueDate) : '-'}</span>
                  <span style="margin-right: 12px;"><strong>Status:</strong> <span style="color: ${action.status === 'completed' ? '#059669' : '#dc2626'}; font-weight: bold;">${action.status || 'Pendente'}</span></span>
                  ${action.completedDate ? `<span style="color: #059669;"><strong>Concluída:</strong> ${formatDate(action.completedDate)}</span>` : ''}
                </div>
                <p style="margin-top: 8px;">${action.description || ''}</p>
              </li>
            `).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        !options?.hideComments && comments && comments.length > 0
          ? `
        <div class="section">
          <h2>Comentários</h2>
          <div style="margin-top: 16px;">
            ${commentsListHTML}
          </div>
        </div>
      `
          : ''
      }

      <div style="height: 60px;"></div>
    </body>
    </html>
  `;

  const fileName = `Auditoria_${storeNumber}_${auditDate.replace(/\//g, '-')}.pdf`;

  const pdfRenderOptions = {
    margin: [20, 15, 30, 15],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true
    },
    jsPDF: {
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    },
    // Se ainda assim partir o título da secção do conteúdo, testa evitar tudo:
    // pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    html2pdf().set(pdfRenderOptions).from(htmlContent).save();
    return { success: true, filename: fileName };
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
