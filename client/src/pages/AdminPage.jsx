import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearQuestionError, deleteQuestion, fetchQuestions, saveQuestion } from '../features/questions/questionSlice';

const blankQuestion = () => ({ id: null, text: '', options: ['', '', '', ''], correctAnswerIndex: 0 });

export default function AdminPage() {
  const dispatch = useDispatch();
  const { list: questions, status, busy, error } = useSelector((state) => state.questions);
  const [form, setForm] = useState(blankQuestion);
  const editor = useRef(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => { dispatch(fetchQuestions()); }, [dispatch]);

  function edit(question) {
    dispatch(clearQuestionError());
    setValidationError('');
    setForm({
      id: question._id, text: question.text, options: [...question.options],
      correctAnswerIndex: question.correctAnswerIndex
    });
    editor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    editor.current?.querySelector('input')?.focus({ preventScroll: true });
  }

  async function save(event) {
    event.preventDefault();
    const options = form.options.map((option) => option.trim());
    const correctAnswerIndex = Number(form.correctAnswerIndex);
    if (!form.text.trim() || options.some((option) => !option) ||
        !Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      setValidationError('Enter a question, all options, and a valid correct answer index.');
      return;
    }
    setValidationError('');
    try {
      await dispatch(saveQuestion({ ...form, text: form.text.trim(), options, correctAnswerIndex })).unwrap();
      setForm(blankQuestion());
    } catch {
      // The question slice supplies the error message.
    }
  }

  async function remove(question) {
    if (!window.confirm('Delete this question?')) return;
    try {
      await dispatch(deleteQuestion(question._id)).unwrap();
      if (form.id === question._id) setForm(blankQuestion());
    } catch {
      // The question slice supplies the error message.
    }
  }

  return <section className="question-management">
    <h2>Questions</h2>
    {(error || validationError) && <div className="alert alert-danger" role="alert">{validationError || error}</div>}
    <form className="question-editor" ref={editor} onSubmit={save}>
      <div className="question-field">
        <label htmlFor="question-text-input">Question Text:</label>
        <input className="form-control" id="question-text-input" required value={form.text}
          onChange={(event) => setForm({ ...form, text: event.target.value })} />
      </div>
      <div className="question-field">
        <label htmlFor="question-option-0">Options:</label>
        <div className="question-options-editor">
          {form.options.map((option, index) => <input className="form-control" key={index}
            id={'question-option-' + index} aria-label={'Option ' + (index + 1)} required value={option}
            onChange={(event) => setForm({
              ...form, options: form.options.map((value, optionIndex) => optionIndex === index ? event.target.value : value)
            })} />)}
        </div>
      </div>
      <div className="question-field">
        <label htmlFor="correct-answer-index">Correct Answer <br />Index:</label>
        <input className="form-control" id="correct-answer-index" type="number" min={0}
          max={form.options.length - 1} step={1} required value={form.correctAnswerIndex}
          onChange={(event) => setForm({ ...form, correctAnswerIndex: event.target.value })} />
      </div>
      <div className="edit-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving...' : form.id ? 'Update Question' : 'Add Question'}
        </button>
        {form.id && <button type="button" className="btn btn-secondary" disabled={busy}
          onClick={() => { setForm(blankQuestion()); setValidationError(''); dispatch(clearQuestionError()); }}>Cancel</button>}
      </div>
    </form>
    {status === 'loading' && <p role="status">Loading questions...</p>}
    {status === 'ready' && questions.length === 0 && <p>No questions available.</p>}
    {questions.length > 0 && <ul className="question-list">
      {questions.map((question) => <li key={question._id}>
        <h3>{question.text}</h3>
        <ul>{question.options.map((option, index) => <li key={index}>{option}</li>)}</ul>
        <div className="question-actions">
          <button className="btn btn-warning" disabled={busy} onClick={() => edit(question)}>Edit</button>
          <button className="btn btn-danger" disabled={busy} onClick={() => remove(question)}>Delete</button>
        </div>
      </li>)}
    </ul>}
  </section>;
}
