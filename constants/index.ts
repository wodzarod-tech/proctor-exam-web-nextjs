export const subjects = [
  "maths",
  "language",
  "science",
  "history",
  "coding",
  "economics",
];

export const subjectsColors = {
  science: "#E5D0FF",
  maths: "#FFDA6E",
  language: "#BDE7FF",
  coding: "#FFC8E4",
  history: "#FFECC8",
  economics: "#C8FFDF",
};

export const voices = {
  male: { casual: "2BJW5coyhAzSr8STdHbE", formal: "c6SfcYrb2t09NHXiT80T" },
  female: { casual: "ZIlrSGI4jZqobxRKprJz", formal: "sarah" },
};

export const recentSessions = [
  {
    id: "1",
    subject: "science",
    name: "Neura the Brainy Explorer",
    topic: "Neural Network of the Brain",
    duration: 45,
    color: "#E5D0FF",
  },
  {
    id: "2",
    subject: "maths",
    name: "Countsy the Number Wizard",
    topic: "Derivatives & Integrals",
    duration: 30,
    color: "#FFDA6E",
  },
  {
    id: "3",
    subject: "language",
    name: "Verba the Vocabulary Builder",
    topic: "English Literature",
    duration: 30,
    color: "#BDE7FF",
  },
  {
    id: "4",
    subject: "coding",
    name: "Codey the Logic Hacker",
    topic: "Intro to If-Else Statements",
    duration: 45,
    color: "#FFC8E4",
  },
  {
    id: "5",
    subject: "history",
    name: "Memo, the Memory Keeper",
    topic: "World Wars: Causes & Consequences",
    duration: 15,
    color: "#FFECC8",
  },
  {
    id: "6",
    subject: "economics",
    name: "The Market Maestro",
    topic: "The Basics of Supply & Demand",
    duration: 10,
    color: "#C8FFDF",
  },
];

export const exam =
{
  "title": "APX exam",
  "description": "Examen de programación APX",
  "questions": [
    {
      "text": "¿Cuál de los siguientes enunciados son incorrectos acerca de la nomenclatura de una transacción?",
      "type": "checkbox",
      "points": 1,
      "required": false,
      "options": [
        {
          "text": "a. Debe haber un código de versión. Este debe ser igual al número del pom.xml",
          "checked": true
        },
        {
          "text": "b. Debe tener un código de entrono. Este código de entorno es de 2 caracteres.",
          "checked": true
        },
        {
          "text": "c. Debe tener un código de transacción. Suele ir después de la letra y son 3 caracteres alfanuméricos.",
          "checked": false
        },
        {
          "text": "d. Debe tener un código de país. Este código de país debe tener 2 caracteres.",
          "checked": false
        },
        {
          "text": "e. Debe tener un código de aplicación, comúnmente conocido como UUAA y debe ser un código de 4 caracteres.",
          "checked": false
        }
      ],
      "feedbackOk": "Well done!",
      "feedbackError": "Remember that..."
    },
    {
      "text": "¿Cuál de las siguientes preguntas son incorrectas sobre la nomenclatura de una transacción?",
      "type": "radio",
      "points": 1,
      "required": false,
      "options": [
        {
          "text": "a. Debe haber un país: debe tener 2 caracteres",
          "checked": false
        },
        {
          "text": "b. Ninguna",
          "checked": false
        },
        {
          "text": "c. Debe haber un código de aplicación, comúnmente conocido como UUAA: Debe ser un código de 4 caracteres",
          "checked": false
        },
        {
          "text": "d. Debe haber un número de versión. Este debe ser igual al número del pom.xml",
          "checked": true
        }
      ],
      "feedbackOk": "Well done - question 2!",
      "feedbackError": "Remember that... - question 2"
    },
    {
      "text": "¿Para visualizar las dependencias de las transacciones, en qué lugar del proyecto me debo ubicar?",
      "type": "radio",
      "points": 1,
      "required": false,
      "options": [
        {
          "text": "a. En cualquier ubicación.",
          "checked": false
        },
        {
          "text": "b. En la transacción en específico",
          "checked": false
        },
        {
          "text": "c. Debo estar en artifact",
          "checked": false
        },
        {
          "text": "d. Debo estar en la librería",
          "checked": false
        },
        {
          "text": "e. Debo estar en el POM",
          "checked": true
        }
      ],
      "feedbackOk": "Well done! - question 3",
      "feedbackError": "Remember that... - question 3"
    }
  ],
  "settings": {
    "general": {
      "shuffleQuestions": false,
      "shuffleOptions": false,
      "viewToggleQuestions": true,
      "viewQuestions": true,
      "scoreMin": 70
    },
    "timer": {
      "enabled": true,
      "hours": 1,
      "minutes": 0
    },
    "camera": {
      "enabled": true,
      "faceAbsence": true,
      "eyeTracking": true
    },
    "microphone": {
      "enabled": true,
      "loudNoise": true
    },
    "screen": {
      "tabSwitch": true,
      "fullscreenExit": true,
      "devToolsOpen": true,
      "leaveFullScreen": true,
      "blockKeyShortcuts": true,
      "secondMonitor": true
    }
  }
};
