import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPublicSettings } from '@/api/candidates';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/common/SEO';
import styles from './CustomPage.module.css';

export default function CustomPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getPublicSettings();
        if (res.data?.webEditorConfig?.customPages) {
          const pages = res.data.webEditorConfig.customPages;
          const found = pages.find(p => p.slug === slug);
          if (found) {
            setPageData(found);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  if (!pageData) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="page-wrapper">
      <SEO title={pageData.title} />
      <section className="section">
        <div className={`container ${styles.content}`}>
          <div dangerouslySetInnerHTML={{ 
            __html: (() => {
              if (!pageData.html) return '';
              const cleanBase = window.location.hostname === 'localhost' 
                ? 'http://localhost:25552/uploads' 
                : `${window.location.origin}/api/uploads`;
              return pageData.html.replace(/src="\/uploads\//g, `src="${cleanBase}/`);
            })()
          }} />
        </div>
      </section>
    </div>
  );
}
