import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router';
import { clearResult, fetchQuiz, fetchQuizzes, nextQuestion, selectAnswer, submitQuiz } from '../features/quizzes/quizSlice';

export default function QuizPage() {
  const { quizId } = useParams();
  const dispatch = useDispatch();
  const { list, listStatus, current: quiz, currentStatus, questionIndex, answers, result, submitStatus, error } =
    useSelector((state) => state.quizzes);

  useEffect(() => {
    let active = true;
    dispatch(clearResult());
    async function load() {
      try {
        if (quizId) {
          await dispatch(fetchQuiz(quizId)).unwrap();
        } else {
          const quizzes = await dispatch(fetchQuizzes()).unwrap();
          if (active && quizzes.length === 1) await dispatch(fetchQuiz(quizzes[0]._id)).unwrap();
        }
      } catch {
        // The quiz slice supplies the error message.
      }
    }
    load();
    return () => { active = false; };
  }, [dispatch, quizId]);

  async function submit(event) {
    event.preventDefault();
    if (!quiz || submitStatus === 'loading') return;
    const question = quiz.questions[questionIndex];
    if (answers[question._id] === undefined) return;
    if (questionIndex < quiz.questions.length - 1) {
      dispatch(nextQuestion());
    } else {
      try {
        await dispatch(submitQuiz({ id: quiz._id, answers })).unwrap();
      } catch {
        // Keep the last answer selected so a failed request can be retried.
      }
    }
  }

  if (listStatus === 'loading' || currentStatus === 'loading') return <p role="status">Loading quiz...</p>;
  if (currentStatus === 'error' || (!quizId && listStatus === 'error')) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }
  if (result) {
    return <section className="quiz-completed" aria-live="polite">
      <h2>Quiz Completed</h2>
      <p>Your score: {result.score}</p>
      <button className="btn btn-primary" onClick={() => dispatch(clearResult())}>Restart Quiz</button>
    </section>;
  }
  if (!quiz) {
    if (listStatus !== 'ready') return <p role="status">Loading quiz...</p>;
    return <section className="quiz-selection">
      <h2>Quiz</h2>
      {list.length === 0 ? <p>No quizzes available.</p> : list.length > 1 ? (
        <div className="list-group">
          {list.map((item) => <Link key={item._id} className="list-group-item list-group-item-action"
            to={'/dashboard/quiz/' + item._id}>{item.title}</Link>)}
        </div>
      ) : <p role="status">Loading quiz...</p>}
    </section>;
  }
  const question = quiz.questions[questionIndex];
  return <section className="quiz-screen">
    <h2>Quiz</h2>
    {!question ? <p>No questions available.</p> : (
      <form className="question-step" onSubmit={submit}>
        <h3 id="question-text">{question.text}</h3>
        <fieldset className="quiz-options" aria-labelledby="question-text">
          {question.options.map((option, optionIndex) => <label className="quiz-option" key={optionIndex}>
            <input type="radio" name={question._id} value={optionIndex} required
              checked={answers[question._id] === optionIndex}
              onChange={() => dispatch(selectAnswer({ questionId: question._id, optionIndex }))} />
            <span>{option}</span>
          </label>)}
        </fieldset>
        {submitStatus === 'error' && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
        <button className="btn btn-primary" disabled={submitStatus === 'loading'}>
          {submitStatus === 'loading' ? 'Submitting...' : 'Submit Answer'}
        </button>
      </form>
    )}
  </section>;
}
