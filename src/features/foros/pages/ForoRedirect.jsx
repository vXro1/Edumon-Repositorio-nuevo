// src/features/foros/pages/ForoRedirect.jsx
// Canonical redirect: /foros/:id → /curso/:cursoId/foro/:id
// Fetches the forum to get its cursoId, then redirects.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { forosGetById } from '@/lib/apiClient';
import { normalizeForo } from '@/lib/normalizers/foro';

const ForoRedirect = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [error,  setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    forosGetById(id)
      .then(res => {
        if (!mounted) return;
        const foro = normalizeForo(res?.foro ?? res);
        if (foro?.cursoId) {
          navigate(`/curso/${foro.cursoId}/foro/${id}`, { replace: true });
        } else {
          setError(true);
        }
      })
      .catch(() => { if (mounted) setError(true); });

    return () => { mounted = false; };
  }, [id, navigate]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          No se pudo encontrar el foro. <a href="/foros">Ver todos los foros</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 200, gap: 10, color: 'var(--color-text-muted)', fontSize: 14 }}>
      <span style={{
        width: 18, height: 18, border: '2.5px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)', borderRadius: '50%',
        animation: 'auth-spin 0.7s linear infinite', display: 'inline-block',
      }} />
      Redirigiendo al foro…
    </div>
  );
};

export default ForoRedirect;
