import { useCallback, useMemo, useState } from "react";

import questionsData from "../data/questions.json";
import teamMembersData from "../data/teamMembers.json";

import type {
  GameRound,
  Question,
  TeamMember,
} from "../types/game";

/* ============================================================
   DATA
   ============================================================ */

const questions: Question[] = questionsData.questions;

const teamMembers: TeamMember[] =
  teamMembersData.teamMembers;

/* ============================================================
   HELPERS
   ============================================================ */

function randomItem<T>(array: T[]): T {
  return array[
    Math.floor(Math.random() * array.length)
  ];
}

function removeItem<T>(
  array: T[],
  item: T
): T[] {
  return array.filter((value) => value !== item);
}

/* ============================================================
   GAME BAG HOOK
   ============================================================ */

function useGameBags() {
  /*
   * Every question gets an ID.
   */
  const questionIds = useMemo(
    () => questions.map((question) => question.id),
    []
  );

  /*
   * Global question bag.
   *
   * Example:
   *
   * ["q1", "q3", "q5"]
   *
   * Only questions remaining in the current
   * cycle are stored here.
   */
  const [questionBag, setQuestionBag] =
    useState<string[]>(questionIds);

  /*
   * Every question gets its own rater bag.
   *
   * Example:
   *
   * {
   *   q1: ["Alex Johnson", "Maya Patel"],
   *   q2: ["Jordan Lee"],
   *   q3: [...]
   * }
   */
  const [raterBags, setRaterBags] =
    useState<Record<string, string[]>>(() => {
      return Object.fromEntries(
        questions.map((question) => [
          question.id,
          question.answers.map(
            (answer) => answer.memberName
          ),
        ])
      );
    });

  /*
   * Draw a question + rater.
   */
  const drawRound =
    useCallback((): GameRound | null => {
      if (questions.length === 0) {
        return null;
      }

      /* ==========================================
         QUESTION BAG
         ========================================== */

      let availableQuestions = questionBag;

      /*
       * All questions have been played.
       * Refill the global bag.
       */
      if (availableQuestions.length === 0) {
        availableQuestions = [...questionIds];
      }

      const questionId =
        randomItem(availableQuestions);

      const question = questions.find(
        (item) => item.id === questionId
      );

      if (!question) {
        return null;
      }

      /*
       * Remove question from current bag.
       */
      setQuestionBag(
        removeItem(
          availableQuestions,
          questionId
        )
      );

      /* ==========================================
         RATER BAG
         ========================================== */

      let availableRaters =
        raterBags[question.id] ?? [];

      /*
       * All raters for this question have been
       * shown. Refill ONLY this question's bag.
       */
      if (availableRaters.length === 0) {
        availableRaters =
          question.answers.map(
            (answer) => answer.memberName
          );
      }

      const memberName =
        randomItem(availableRaters);

      /*
       * Remove rater from this question's bag.
       */
      setRaterBags((previous) => ({
        ...previous,

        [question.id]: removeItem(
          availableRaters,
          memberName
        ),
      }));

      /* ==========================================
         FIND ANSWER
         ========================================== */

      const answer = question.answers.find(
        (item) =>
          item.memberName === memberName
      );

      if (!answer) {
        console.error(
          `No answer found for ${memberName} on ${question.id}`
        );

        return null;
      }

      /* ==========================================
         FIND TEAM MEMBER
         ========================================== */

      const member = teamMembers.find(
        (item) => item.name === memberName
      );

      if (!member) {
        console.error(
          `No team member found for ${memberName}`
        );

        return null;
      }

      /* ==========================================
         COMPLETE ROUND
         ========================================== */

      return {
        question,
        memberName,
        rating: answer.rating,
        image: member.image,
      };
    }, [
      questionBag,
      questionIds,
      raterBags,
    ]);

  /*
   * Reset EVERYTHING.
   */
  const resetBags = useCallback(() => {
    setQuestionBag([...questionIds]);

    setRaterBags(
      Object.fromEntries(
        questions.map((question) => [
          question.id,
          question.answers.map(
            (answer) => answer.memberName
          ),
        ])
      )
    );
  }, [questionIds]);

  return {
    drawRound,
    resetBags,
    remainingQuestions:
      questionBag.length,
  };
}

/* ============================================================
   START SCREEN
   ============================================================ */

interface StartScreenProps {
  onStart: () => void;
}

function StartScreen({
  onStart,
}: StartScreenProps) {
  return (
    <div className="card mx-auto w-full max-w-2xl bg-base-100 shadow-2xl">
      <div className="card-body items-center text-center p-8 md:p-12">

        <div className="badge badge-neutral badge-lg">
          Guess the Rating
        </div>

        <h1 className="text-4xl md:text-6xl font-black mt-4">
          They&apos;re a 10 <span className="text-error">but...</span>
        </h1>

        <p className="text-lg text-base-content/60 max-w-xl mt-4">
          We have rated different
          traits.
          <br /> 
          Can you predict what rating
          we gave?
        </p>

        {/*
        <div className="stats shadow mt-8">

          <div className="stat text-center">
            <div className="stat-title">
              Questions
            </div>

            <div className="stat-value text-primary">
              {questions.length}
            </div>
          </div>

          <div className="stat text-center">
            <div className="stat-title">
              Raters
            </div>

            <div className="stat-value text-primary">
              {teamMembers.length}
            </div>
          </div>

        </div>
        */}

        <button
          className="btn btn-neutral btn-lg mt-8 px-12"
          onClick={onStart}
        >
          Start Game
        </button>

      </div>
    </div>
  );
}

/* ============================================================
   QUESTION SCREEN
   ============================================================ */

interface QuestionScreenProps {
  round: GameRound;
  guess: number;
  setGuess: (value: number) => void;
  onSubmit: () => void;
}

function getRatingColor(value: number) {
  if (value <= 2) {
    return {
      text: "text-error",
      range: "range-error",
    };
  }
  if (value <= 4) {
    return {
      text: "text-warning",
      range: "range-warning",
    };
  }
  if (value <= 6) {
    return {
      text: "text-success",
      range: "range-success",
    };
  }
  if (value <= 8) {
    return {
      text: "text-accent",
      range: "range-accent",
    };
  }
  return {
    text: "text-info",
      range: "range-info",
  };
}

function QuestionScreen({
  round,
  guess,
  setGuess,
  onSubmit,
}: QuestionScreenProps) {
  const color = getRatingColor(guess);

  return (
    <div className="card mx-auto w-full max-w-2xl bg-base-100 shadow-2xl">

      <div className="card-body p-6 md:p-10">

        <div className="flex justify-between items-center">
          <div className="badge badge-neutral">
            Guess the Rating
          </div>

          <span className="text-sm text-base-content/50">
            1 — 10
          </span>
        </div>

        {/* Question */}

        <div className="mt-8">

          <p className="uppercase tracking-widest text-sm font-bold text-neutral">
            They&apos;re a 10 but...
          </p>

          <h2 className="text-3xl md:text-5xl font-black leading-tight mt-2">
            {round.question.trait}
          </h2>

        </div>

        <div className="divider" />

        {/* Rater */}

        <div className="flex items-center gap-4">

          <div className="avatar">

            <div className="w-16 h-16 rounded-full ring ring-neutral ring-offset-2 ring-offset-base-100">

              <img
                src={round.image}
                alt={`${round.memberName}'s profile`}
              />

            </div>

          </div>

          <div>

            <p className="text-sm text-base-content/50">
              Rating by
            </p>

            <p className="text-xl font-bold">
              {round.memberName}
            </p>

          </div>

        </div>

        {/* Slider Section */}
        <div className="mt-8">
          <div className="flex items-end justify-between mb-3">
            <span className="font-semibold">Your guess</span>

            {/* Dynamic number text color */}
            <span className={`text-4xl font-black transition-colors ${color.text}`}>
              {guess}
            </span>
          </div>

          {/* Dynamic slider thumb color */}
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={guess}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setGuess(Number(event.target.value))
            }
            className={`range w-full transition-colors ${color.range}`}
          />

          <div className="flex justify-between px-1 mt-2 text-xs text-base-content/40">
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
        </div>

        <button
          className="btn btn-neutral btn-lg w-full mt-8"
          onClick={onSubmit}
        >
          Submit Guess
        </button>

      </div>
    </div>
  );
}

/* ============================================================
   FEEDBACK SCREEN
   ============================================================ */

interface FeedbackScreenProps {
  round: GameRound;
  guess: number;
  onNext: () => void;
  onReset: () => void;
}

function FeedbackScreen({
  round,
  guess,
  onNext,
  onReset,
}: FeedbackScreenProps) {
  const difference = Math.abs(
    guess - round.rating
  );
  
  const exact = difference === 0;
  const feedbackColor =
    difference === 0
      ? "text-success"
      : difference === 1
      ? "text-warning"
      : "text-error";

  return (
    <div className="card w-full mx-auto max-w-2xl bg-base-100 shadow-2xl">

      <div className="card-body items-center text-center p-8 md:p-12">

        <div className="text-6xl">
          {exact ? "🎯" : "🤔"}
        </div>

        <h2 className={`text-3xl md:text-4xl font-black mt-4 ${feedbackColor}`}>
          {exact ? "Exact match!" : `Off by ${difference}!`}
        </h2>

        <p className="text-lg text-base-content/60 mt-3 ">
          You guessed{" "}
          <strong className="text-neutral text-2xl">
            {guess}
          </strong>
          , but{" "}
          <strong className="text-neutral">
            {round.memberName}
          </strong>{" "}
          rated them a{" "}
          <strong className="text-neutral text-2xl">
            {round.rating}
          </strong>
          .
        </p>

        <div className="avatar mt-6">

          <div className="w-24 h-24 rounded-full ring ring-neutral ring-offset-2 ring-offset-base-100">

            <img
              src={round.image}
              alt={round.memberName}
            />

          </div>

        </div>

        <div className="stats shadow mt-6 w-full">

          <div className="stat text-center">
            <div className="stat-title">
              Your Guess
            </div>

            <div className={`stat-value ${feedbackColor}`}>
              {guess}
            </div>
          </div>

          <div className="stat text-center">
            <div className="stat-title">
              Actual Rating
            </div>

            <div className="stat-value">
              {round.rating}
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-8">

          <button
            className="btn btn-neutral flex-1"
            onClick={onNext}
          >
            Next Question
          </button>

          <button
            className="btn btn-outline flex-1"
            onClick={onReset}
          >
            Back to Start
          </button>

        </div>

      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function TheyreATenGame() {
  type Screen =
    | "start"
    | "question"
    | "feedback";

  const [screen, setScreen] =
    useState<Screen>("start");

  const [round, setRound] =
    useState<GameRound | null>(null);

  const [guess, setGuess] =
    useState<number>(5);

  const {
    drawRound,
    resetBags,
    //remainingQuestions,
  } = useGameBags();

  const startRound = useCallback(() => {
    const newRound = drawRound();

    if (!newRound) {
      return;
    }

    setRound(newRound);
    setGuess(5);
  }, [drawRound]);

  const handleStart = () => {
    startRound();
    setScreen("question");
  };

  const handleSubmit = () => {
    setScreen("feedback");
  };

  const handleNext = () => {
    startRound();
    setScreen("question");
  };

  const handleReset = () => {
    resetBags();
    setRound(null);
    setGuess(5);
    setScreen("start");
  };

  return (
    <main data-theme="light" className="min-h-screen bg-gray-200 flex items-center justify-center p-4">

      <div className="w-full max-w-3xl">

        {screen === "start" && (
          <StartScreen
            onStart={handleStart}
          />
        )}

        {screen === "question" &&
          round && (
            <QuestionScreen
              round={round}
              guess={guess}
              setGuess={setGuess}
              onSubmit={handleSubmit}
            />
          )}

        {screen === "feedback" &&
          round && (
            <FeedbackScreen
              round={round}
              guess={guess}
              onNext={handleNext}
              onReset={handleReset}
            />
          )}
{/*
        {screen !== "start" && (
          <p className="text-center text-xs text-base-content/40 mt-4">
            {remainingQuestions} question
            {remainingQuestions === 1
              ? ""
              : "s"} remaining in current cycle
          </p>
        )}
*/}

      </div>

    </main>
  );
}