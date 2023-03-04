const speech = require('@google-cloud/speech');
const fs = require('fs');
const { TranslationServiceClient } = require('@google-cloud/translate');  // for translation
const {Translate} = require('@google-cloud/translate').v2;
const stopword = require('stopword'); // remove extra word
const { en } = require('@vitalets/google-translate-api/languages');

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

    // Detects the language of the speech
    const [detectionResult] = await translate.detect(transcription);
    const sourceLanguage = detectionResult.language;
    console.log(`Detected language: ${sourceLanguage}`);


    let translation;
    if (sourceLanguage === 'en') {
      // If the source language is already English, skip translation
      translation = transcription;
      //console.log(`Translation: ${translation}`);
    } else {
    const [translationResult] = await translate.translate(transcription, {
        from: sourceLanguage,
        to: 'en',
      });
      const translation = translationResult;
      console.log(`Translation: ${translation}`); // print the sentence of word that are present in speech 
    }

    const preprocessed = preprocess(translation); // print the word array after removing extra words
    const matchedIntent = matchIntent(preprocessed);   

    if (matchedIntent) {
      // send the response in text format
      const responseText = getResponseText(matchedIntent, preprocessed);
      if (sourceLanguage === 'en') {
        console.log(responseText);
      } else {
      const [translationResult] = await translate.translate(responseText, {
        from: 'en',
        to: sourceLanguage,
      });
      const translatedResponse = translationResult;
      console.log(translatedResponse);
    }
    } else {
      redirectLiveAgent();
    }
  })
  .catch((err) => {
    console.error('ERROR:', err);
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
    }else if (text.includes('old')) {
        return 'old';
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
    }else if (intent === 'old') {
        return '24';
      }
  }
  
  function redirectLiveAgent() {
    // redirect the call to a live agent
    console.log('Connecting you with liveAgent')
  }
