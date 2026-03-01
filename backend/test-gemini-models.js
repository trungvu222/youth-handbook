require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
console.log('🔑 API Key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'NOT FOUND');

const genAI = new GoogleGenerativeAI(apiKey);

// List of models to test
const modelsToTest = [
  'gemini-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'models/gemini-pro',
  'models/gemini-1.5-flash',
];

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Testing model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName} works! Response: ${text.slice(0, 50)}...`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Testing available Gemini models...\n');
  
  for (const modelName of modelsToTest) {
    const works = await testModel(modelName);
    if (works) {
      console.log(`\n✨ RECOMMENDED MODEL: ${modelName}\n`);
      break;
    }
  }
}

main().catch(console.error);
