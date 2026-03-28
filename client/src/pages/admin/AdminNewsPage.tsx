import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppDispatch } from '../../app/hooks';
import { addNotification } from '../../features/ui/uiSlice';
import { formatDate } from '../../utils/timezone';
import type { NewsArticle } from '../../types';

export function AdminNewsPage() {
  const dispatch = useAppDispatch();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch from a public news endpoint (not implemented yet in backend — stub)
  const loadArticles = async () => {
  };

  useEffect(() => { loadArticles(); }, []);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setShowForm(true);
  };

  const openEdit = (article: NewsArticle) => {
    setEditing(article);
    setTitle(article.title);
    setContent(article.content);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminService.updateArticle(editing.id, { title, content });
        setArticles((prev) => prev.map((a) => (a.id === editing.id ? updated.data : a)));
        dispatch(addNotification({ type: 'success', message: 'Artículo actualizado' }));
      } else {
        const created = await adminService.createArticle({ title, content });
        setArticles((prev) => [created.data, ...prev]);
        dispatch(addNotification({ type: 'success', message: 'Artículo creado' }));
      }
      setShowForm(false);
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al guardar artículo' }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    try {
      await adminService.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      dispatch(addNotification({ type: 'success', message: 'Artículo eliminado' }));
    } catch {
      dispatch(addNotification({ type: 'error', message: 'Error al eliminar artículo' }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Gestión de Noticias</h2>
        <Button size="sm" onClick={openNew}>+ Nueva noticia</Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-4">
          <h3 className="font-medium text-purple-900">{editing ? 'Editar artículo' : 'Nuevo artículo'}</h3>
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Título del artículo"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Contenido</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="Contenido del artículo..."
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Guardar' : 'Publicar'}</Button>
          </div>
        </form>
      )}

      {/* Articles list */}
      {articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
          No hay artículos publicados
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{article.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(article.publishedTimestamp)}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.content}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(article)}>✏️</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(article.id)}>🗑</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
