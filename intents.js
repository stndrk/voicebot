const readline = require('readline')
const speech = require('@google-cloud/speech');
const fs = require('fs');
const { TranslationServiceClient } = require('@google-cloud/translate');  // for translation
const { LanguageServiceClient } = require('@google-cloud/language');
const {Translate} = require('@google-cloud/translate').v2;
const stopword = require('stopword'); // remove extra word

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const languageClient = new LanguageServiceClient({
  projectId: 'voicebot-riya-9fkc',
  keyFilename: 'voicebot-riya-9fkc-45e8c8e3b713.json',
});
// Instantiates a client
const translate = new Translate({
    key:'AIzaSyCfg-Lw0OKUncu39BUi92kd55LT5Iy04sk',
});

// Creates a client
const client = new speech.SpeechClient({
  projectId: 'voicebot-riya-9fkc',
  keyFilename: 'voicebot-riya-9fkc-45e8c8e3b713.json',
});

// The name of the audio file to transcribe
const fileName = 'how-old-is-the-brooklyn-bridge.raw';

// Reads a local audio file and converts it to base64
const file = fs.readFileSync(fileName);
const audioBytes = file.toString('base64');

rl.question("Enter target language code: ", async (targetLanguage) => {
// The audio file's encoding, sample rate in hertz, and BCP-47 language code
const request = { // create a request to sent to the Google Cloud Speech-to-Text API for transcribing the audio file
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US'
    },
    audio: {
      content: audioBytes,
    }
  };  
  
 client.recognize(request) // transcription happen here and print
  .then(async (data) => {
    const response = data[0];
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    console.log(`Transcription: ${transcription}`);

    const document = {
      content: transcription,
      type: 'PLAIN_TEXT',
    };
    const [sentiment] = await languageClient.analyzeSentiment({ document });
    console.log(`Sentiment score: ${sentiment.score}`);
    console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
        
    // Detects the language of the speech
    const [detectionResult] = await translate.detect(transcription);
    const sourceLanguage = detectionResult.language;
    console.log(`Detected language: ${sourceLanguage}`);


    let translation;
    if (sourceLanguage === targetLanguage) {
      // If the source language is already English, skip translation
      translation = transcription;
      //console.log(`Translation: ${translation}`);
    } else {
    const [translationResult] = await translate.translate(transcription, {
        from: sourceLanguage,
        to: targetLanguage,
      });
      const translation = translationResult;
      console.log(`Translation: ${translation}`); // print the sentence of word that are present in speech 
    }

    const preprocessed = preprocess(translation); // print the word array after removing extra words
    const matchedIntent = matchIntent(preprocessed);   

    if (matchedIntent) {
      // send the response in text format
      const responseText = getResponseText(matchedIntent, preprocessed);
      console.log(responseText);
    } else {
      redirectLiveAgent();
    }
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });
  rl.close();
});

function preprocess(text) {
  const arr=text.split(" ");
  console.log(stopword.removeStopwords(arr));
  return stopword.removeStopwords(arr);
  //console.log(str.trim(" ").toLowerCase().split(" "));
  //return str.trim().toLowerCase().split(" ");
}

function matchIntent(text) {
    // match the preprocessed text with your intents
    // return the matched intent or null if no match found
    if (text.includes('Interest')) {
      return 'Interest';
    } else if (text.includes('hello')) {
      return 'hello';
    }else if (text.includes('age')) {
        return 'age';
    } else {
      return '';
    }
  }
  
  function getResponseText(intent, text) {
    // generate the response text based on the intent and the preprocessed text
    // return the response text
    if (intent === 'Interest') {
      return '2.5%';
    } else if (intent === 'hello') {
      return 'hello.';
    }else if (intent === 'age') {
        return '24';
      }
  }
  
  function redirectLiveAgent() {
    // redirect the call to a live agent
    console.log('Connecting you with liveAgent')
  }

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
// rl.question("Enter target language code: ", async (targetLanguage) => {