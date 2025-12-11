import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../services/dbAdapter';
import { Audit, AuditStatus } from '../types';
import { AuditExecution } from './AuditExecution';
import { DotAuditView } from './DotAuditView';

export const DotAuditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!id) { setLoading(false); return; }
      const a = await db.getAuditById(Number(id));
      setAudit(a || null);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return null;
  if (!audit) return null;

  const isEditable = audit.status === AuditStatus.NEW || audit.status === AuditStatus.IN_PROGRESS || (typeof audit.status === 'string' && ['NEW','SCHEDULED','IN_PROGRESS'].includes(String(audit.status).toUpperCase()));

  return isEditable ? <AuditExecution /> : <DotAuditView />;
};

export default DotAuditPage;
