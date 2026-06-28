import { useState } from 'react'
import { getQuizQuestion, QUIZ_QUESTIONS, addXp, unlockAchievement } from '../services/gamificationService'

export function QuizGame() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = getQuizQuestion(questionIndex)
  const maxQuestions = Math.min(QUIZ_QUESTIONS.length, 10)

  const choose = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === question.correctIndex
    if (correct) {
      setScore((s) => s + 1)
      addXp(10, 'Quiz richtig')
    }
    setTotal((t) => t + 1)

    setTimeout(() => {
      if (total + 1 >= maxQuestions) {
        setFinished(true)
        if (score + (correct ? 1 : 0) >= 10) {
          unlockAchievement('ach-quiz-master')
        }
      } else {
        setQuestionIndex((i) => i + 1)
        setSelected(null)
      }
    }, 900)
  }

  const restart = () => {
    setQuestionIndex(0)
    setSelected(null)
    setScore(0)
    setTotal(0)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="quiz">
        <h3 className="quiz__title">Quiz abgeschlossen!</h3>
        <p className="quiz__result">
          Du hast <strong>{score}/{total}</strong> richtig beantwortet.
          {score >= 8 && ' 🏆 Ausgezeichnet!'}
          {score >= 5 && score < 8 && ' 👍 Gut gemacht!'}
          {score < 5 && ' 💪 Mehr üben!'}
        </p>
        <p className="quiz__xp">+{score * 10} XP verdient</p>
        <button type="button" className="btn" onClick={restart}>
          Nochmal spielen
        </button>
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz__progress">
        Frage {total + 1} / {maxQuestions} · Score: {score}
      </div>
      <h3 className="quiz__question">{question.question}</h3>
      <ul className="quiz__options">
        {question.options.map((opt, i) => {
          let cls = 'quiz__option'
          if (selected !== null) {
            if (i === question.correctIndex) cls += ' quiz__option--correct'
            else if (i === selected) cls += ' quiz__option--wrong'
          }
          return (
            <li key={i}>
              <button
                type="button"
                className={cls}
                onClick={() => choose(i)}
                disabled={selected !== null}
              >
                {opt}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
