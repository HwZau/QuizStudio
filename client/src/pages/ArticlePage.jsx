import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearArticleError, deleteArticle, fetchArticles, saveArticle } from '../features/articles/articleSlice';

const blankArticle = () => ({ id: null, title: '', content: '' });

export default function ArticlePage({ admin = false }) {
  const dispatch = useDispatch();
  const { list, status, busy, error } = useSelector((state) => state.articles);
  const [form, setForm] = useState(blankArticle);
  const editor = useRef(null);
  useEffect(() => { dispatch(fetchArticles()); }, [dispatch]);

  async function save(event) {
    event.preventDefault();
    try {
      await dispatch(saveArticle(form)).unwrap();
      setForm(blankArticle());
    } catch {
      // The article slice supplies the error message.
    }
  }

  async function remove(article) {
    if (!window.confirm('Delete this article?')) return;
    try {
      await dispatch(deleteArticle(article._id)).unwrap();
      if (form.id === article._id) setForm(blankArticle());
    } catch {
      // The article slice supplies the error message.
    }
  }

  return <section className="article-page">
    <h2>Articles</h2>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {admin && <form className="question-editor" ref={editor} onSubmit={save}>
      <div className="question-field">
        <label htmlFor="article-title">Title:</label>
        <input className="form-control" id="article-title" required maxLength={200} value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </div>
      <div className="question-field">
        <label htmlFor="article-content">Content:</label>
        <textarea className="form-control" id="article-content" rows={6} required value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })} />
      </div>
      <div className="edit-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : form.id ? 'Update Article' : 'Add Article'}</button>
        {form.id && <button type="button" className="btn btn-secondary" disabled={busy}
          onClick={() => { setForm(blankArticle()); dispatch(clearArticleError()); }}>Cancel</button>}
      </div>
    </form>}
    {status === 'loading' && <p role="status">Loading articles...</p>}
    {status === 'ready' && list.length === 0 && <p>No articles available.</p>}
    {list.map((article) => <article className="article-entry" key={article._id}>
      <h3>{article.title}</h3>
      <p className="article-content">{article.content}</p>
      {admin && <div className="question-actions">
        <button className="btn btn-warning" disabled={busy} onClick={() => {
          setForm({ id: article._id, title: article.title, content: article.content });
          dispatch(clearArticleError());
          editor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          editor.current?.querySelector('input')?.focus({ preventScroll: true });
        }}>Edit</button>
        <button className="btn btn-danger" disabled={busy} onClick={() => remove(article)}>Delete</button>
      </div>}
    </article>)}
  </section>;
}
