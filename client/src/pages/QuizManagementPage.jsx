import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { api } from '../lib/api';
import { fetchQuestions } from '../features/questions/questionSlice';
import { fetchQuizzes } from '../features/quizzes/quizSlice';

const blankQuiz = () => ({ id: null, title: '', description: '', questions: [] });

export default function QuizManagementPage() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const { list: quizzes } = useSelector((state) => state.quizzes);
  const { list: questions } = useSelector((state) => state.questions);
  const [form, setForm] = useState(blankQuiz);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    await Promise.all([dispatch(fetchQuizzes()).unwrap(), dispatch(fetchQuestions()).unwrap()]);
  }
  useEffect(() => { reload().catch((failure) => setError(failure.message)); }, [token]);

  async function save(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      await api(form.id ? '/quizzes/' + form.id : '/quizzes', {
        method: form.id ? 'PUT' : 'POST', token,
        body: { title: form.title, description: form.description, questions: form.questions }
      });
      setForm(blankQuiz()); await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function remove(quiz) {
    if (!window.confirm('Delete this quiz?')) return;
    setError(''); setBusy(true);
    try {
      await api('/quizzes/' + quiz._id, { method: 'DELETE', token });
      if (form.id === quiz._id) setForm(blankQuiz());
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <section className="quiz-editor-page">
    <h2>Quizzes</h2>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form className="question-editor" onSubmit={save}>
      <label className="form-label" htmlFor="quiz-title">Title:</label>
      <input className="form-control mb-3" id="quiz-title" required value={form.title}
        onChange={(event) => setForm({ ...form, title: event.target.value })} />
      <label className="form-label" htmlFor="quiz-description">Description:</label>
      <textarea className="form-control mb-3" id="quiz-description" rows={3} required value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <fieldset>
        <legend>Questions:</legend>
        <div className="question-picker">
          {questions.map((question) => <label key={question._id}>
            <input type="checkbox" checked={form.questions.includes(question._id)}
              onChange={() => setForm({
                ...form, questions: form.questions.includes(question._id)
                  ? form.questions.filter((id) => id !== question._id) : [...form.questions, question._id]
              })} />
            {question.text}
          </label>)}
          {questions.length === 0 && <p>No questions available. <Link to="/admin/questions">Add questions</Link></p>}
        </div>
      </fieldset>
      <div className="edit-actions">
        <button className="btn btn-primary" disabled={busy}>{form.id ? 'Update Quiz' : 'Add Quiz'}</button>
        {form.id && <button type="button" className="btn btn-secondary" onClick={() => setForm(blankQuiz())}>Cancel</button>}
      </div>
    </form>
    <div className="list-group">
      {quizzes.map((quiz) => <div className="list-group-item" key={quiz._id}>
        <div><strong>{quiz.title}</strong><p className="mb-0">{quiz.description}</p></div>
        <div className="question-actions">
          <button className="btn btn-warning" disabled={busy} onClick={() => {
            setForm({ ...quiz, id: quiz._id, questions: quiz.questions.map((question) => question._id) });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>Edit</button>
          <button className="btn btn-danger" disabled={busy} onClick={() => remove(quiz)}>Delete</button>
        </div>
      </div>)}
    </div>
  </section>;
}
