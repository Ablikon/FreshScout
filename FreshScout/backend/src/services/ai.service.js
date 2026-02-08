import OpenAI from 'openai';

let openai = null;

function getClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Use GPT to extract search keywords from a natural language query
 * e.g. "хочу приготовить борщ" → ["свекла", "капуста", "морковь", "картофель", "мясо говядина", "томатная паста", "лук"]
 */
export async function extractSearchTerms(query) {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Ты помощник по покупке продуктов в Казахстане. Пользователь описывает что ему нужно, а ты возвращаешь список конкретных продуктов для поиска в магазине. Возвращай JSON массив строк. Каждая строка — название продукта на русском для поиска. Максимум 10 позиций. Без объяснений, только JSON массив.`
        },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '[]';
    // Parse JSON from response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [query];
  } catch (error) {
    console.error('OpenAI error:', error.message);
    return [query]; // fallback to original query
  }
}

export default { extractSearchTerms };
