import { Audit, User } from '../types';

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
  actions?: any[],
  comments?: any[],
  scoresBySection?: any[]
) => {
  // Usar html2pdf do window (carregado via CDN)
  const html2pdf = window.html2pdf;

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

  // Construir seções com critérios
  const sectionsHTML = (checklistData?.sections || [])
    .map((section: any) => {
      const sectionEval = scoresBySection?.find((s: any) => s.section_id === section.id);

      const criteriaBlocksHTML = (section.items || [])
        .map((item: any) => {
          const criteriaHTML = (item.criteria || [])
            .map((criteria: any) => {
              const score = audit.scores?.find((s: any) => s.criteria_id === criteria.id);
              const scoreLabel =
                score?.score === 1 ? '✓ OK' :
                score?.score === 0 ? '✗ KO' : 'Não avaliado';
              const scoreBg =
                score?.score === 1 ? '#d1fae5' :
                score?.score === 0 ? '#fee2e2' : '#f3f4f6';
              const scoreColor =
                score?.score === 1 ? '#059669' :
                score?.score === 0 ? '#dc2626' : '#6b7280';

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

      // Wrapper de toda a secção: título + avaliação + todos os itens
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
            sectionEval?.rating
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

          <div style="page-break-inside: avoid;">
            ${criteriaBlocksHTML}
          </div>
        </div>
      `;
    })
    .join('');

  // Construir lista de ações
  const actionsListHTML = (actions || [])
    .map(action => `
      <li>
        <strong>${action.title || 'Sem título'}</strong><br/>
        <small>Responsável: ${getUserName(action.responsible_user_id)}</small><br/>
        <small>Data Limite: ${formatDate(action.due_date)}</small><br/>
        <small>Status: <strong>${action.status || 'Pendente'}</strong></small><br/>
        <p>${action.description || ''}</p>
      </li>
    `)
    .join('');

  // Construir lista de comentários
  const commentsListHTML = (comments || [])
    .map(comment => `
      <div class="comment-item">
        <strong>${getUserName(comment.user_id)}</strong><br/>
        <small>${formatDate(comment.created_at)}</small><br/>
        <p>${comment.text}</p>
      </div>
    `)
    .join('');

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

      <div class="section resultados-section">
        <h2>Resultados da Avaliação</h2>
        <div style="page-break-inside: avoid;">
          ${sectionsHTML}
        </div>
      </div>

      ${
        actions && actions.length > 0
          ? `
        <div class="section">
          <h2>Ações Criadas</h2>
          <ul>
            ${actionsListHTML}
          </ul>
        </div>
      `
          : ''
      }

      ${
        comments && comments.length > 0
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

  const options = {
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
    html2pdf().set(options).from(htmlContent).save();
    return { success: true, filename: fileName };
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};
