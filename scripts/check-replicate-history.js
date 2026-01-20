/**
 * Check Replicate Prediction History
 * Usage: node scripts/check-replicate-history.js
 */

const Replicate = require('replicate');

async function checkHistory() {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    console.log('🔍 Fetching recent predictions from Replicate...\n');

    // Get recent predictions
    const predictions = [];
    for await (const prediction of replicate.predictions.list()) {
      predictions.push(prediction);
      if (predictions.length >= 20) break; // Get last 20
    }

    console.log(`Found ${predictions.length} recent predictions:\n`);

    // Display predictions
    predictions.forEach((pred, index) => {
      console.log(`${index + 1}. ID: ${pred.id}`);
      console.log(`   Status: ${pred.status}`);
      console.log(`   Created: ${pred.created_at}`);
      console.log(`   Model: ${pred.version}`);
      
      if (pred.input) {
        console.log(`   Params:`);
        console.log(`     - prompt_strength: ${pred.input.prompt_strength}`);
        console.log(`     - guidance: ${pred.input.guidance}`);
        console.log(`     - steps: ${pred.input.num_inference_steps}`);
        
        if (pred.input.prompt) {
          const shortPrompt = pred.input.prompt.substring(0, 80);
          console.log(`     - prompt: ${shortPrompt}...`);
        }
      }
      
      if (pred.output && pred.output.length > 0) {
        console.log(`   Output: ${pred.output[0]}`);
      }
      
      console.log('');
    });

    // Statistics
    const completed = predictions.filter(p => p.status === 'succeeded').length;
    const failed = predictions.filter(p => p.status === 'failed').length;
    
    console.log('\n📊 Statistics:');
    console.log(`   ✅ Succeeded: ${completed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏳ Other: ${predictions.length - completed - failed}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkHistory();
