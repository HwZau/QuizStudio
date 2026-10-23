import { useSelector } from 'react-redux';
import { Link } from 'react-router';

const adminFeatures = [
  {
    title: 'Manage Questions',
    description: 'Build and maintain the question bank for your quizzes.',
    features: ['View, add, edit and delete questions', 'Set answer options and the correct answer'],
    to: '/admin/questions',
    action: 'Open question manager'
  },
  {
    title: 'Manage Quizzes',
    description: 'Organize questions into quizzes for learners.',
    features: ['View, add, edit and delete quizzes', 'Set quiz details and choose questions'],
    to: '/admin/quizzes',
    action: 'Open quiz manager'
  },
  {
    title: 'Manage Articles',
    description: 'Publish reading material and instructions for learners.',
    features: ['View, add, edit and delete articles', 'Write article titles and content'],
    to: '/admin/articles',
    action: 'Open article manager'
  }
];

const learnerFeatures = [
  {
    title: 'Take a Quiz',
    description: 'Practice your knowledge with the available quizzes.',
    features: ['Choose a quiz and answer its questions', 'View your score after submitting and restart to practice'],
    to: '/dashboard/quiz',
    action: 'Start Quiz'
  },
  {
    title: 'Read Articles',
    description: 'Explore articles and instructions published by the admin.',
    features: ['Browse available articles', 'Read the full article content'],
    to: '/dashboard/articles',
    action: 'Browse Articles'
  }
];

export default function Dashboard() {
  const admin = useSelector((state) => state.auth.user?.admin);
  const features = admin ? adminFeatures : learnerFeatures;

  return <section className="dashboard-overview" aria-labelledby="dashboard-features-heading">
    <h2 id="dashboard-features-heading">Available features</h2>
    <p className="dashboard-introduction">
      {admin ? 'Manage your questions, quizzes and articles from one place.' : 'Take a quiz or read an article to get started.'}
    </p>
    <div className="dashboard-feature-grid">
      {features.map((feature) => <article className="dashboard-feature-card" key={feature.to}>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
        <ul>{feature.features.map((item) => <li key={item}>{item}</li>)}</ul>
        <Link className="btn btn-primary" to={feature.to}>{feature.action}</Link>
      </article>)}
    </div>
  </section>;
}
