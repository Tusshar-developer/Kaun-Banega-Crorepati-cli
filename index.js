#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import axios from "axios";
import { decode } from "html-entities";
import { Timer } from "easytimer.js";

let playerName,
  questionNumber = 1,
  question = {};

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
  const rainbowTitle = chalkAnimation.rainbow("Kaun Banega Crorepati \n");

  await sleep();
  rainbowTitle.stop();

  console.log(
    `${chalk.bgBlue(
      "HOW TO PLAY"
    )}\n    You answer questions.\n    There are 16 total questions\n    If you get one answer wrong, you lose.\n    There is a 70 second time limit on every question.\n    Running out of time will result in a loss.\n    Let's Start!\n\n`
  );
}

async function askname() {
  const answers = await inquirer.prompt({
    name: "player_name",
    type: "input",
    message: "What's your name?",
    default() {
      return "Player";
    },
  });

  playerName = answers.player_name;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function winner() {
  console.clear();
  const msg = `You've won\n 7 C R O R E !`;

  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });

  process.exit(1);
}

async function getQuestion() {
  const json = await axios.get("https://opentdb.com/api.php?amount=1");

  var choices = [decode(json.data.results[0].correct_answer)];
  json.data.results[0].incorrect_answers.forEach((answer) => {
    choices.push(decode(answer));
  });

  choices = shuffleArray(choices);

  question.choices = choices;
  question.question = decode(json.data.results[0].question);
  question.correctAnswer = json.data.results[0].correct_answer;
}

async function askQuestion() {
  await getQuestion();

  const answer = await inquirer.prompt({
    name: "question",
    type: "list",
    message: `Question ${questionNumber}: \n  ${question.question}`,
    choices: question.choices,
  });

  return handleAnswer(answer.question == decode(question.correctAnswer));
}

async function handleAnswer(isCorrect) {
  const spinner = createSpinner("Checking answer...").start();
  await sleep();

  if (isCorrect) {
    spinner.success({ text: `Nice work ${playerName}.\n\n` });
    questionNumber++;
  } else {
    spinner.error({
      text: `💀💀💀 Game Over. You lose ${playerName}! Better luck next time\n\n`,
    });
    process.exit(1);
  }
}

async function handleQuiz() {
  console.clear();
  await welcome();
  await askname();

  const timer = new Timer({
    target: { seconds: 70 },
  });

  timer.start();

  timer.addEventListener("secondsUpdated", () => {
    if (timer.getTimeValues().seconds == 70) {
      console.log(
        `💀💀💀 Game Over. ${playerName}, you ran out of time. Better luck next time!\n\n`
      );
      process.exit(1);
    }
  });

  while (questionNumber <= 16) {
    await askQuestion();
    timer.reset();
  }
  winner();
}

handleQuiz();
