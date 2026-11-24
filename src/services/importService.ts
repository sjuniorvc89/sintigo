import { MultipleChoiceOption, QuestionItem } from '../types';

export interface ImportResult {
  success: boolean;
  questions: QuestionItem[];
  errors: string[];
  totalParsed: number;
}

export const SAMPLE_JSON_TEMPLATE = `[
  {
    "prompt": "Dile al camarero con cortesía: 'Disculpe, ¿podría traerme la cuenta, por favor?'",
    "context": "Restaurante en Nueva York",
    "languageToListen": "en-US",
    "difficulty": "facil",
    "expectedConcept": "Excuse me, could you bring me the check, please?",
    "options": [
      {
        "id": "A",
        "text": "Excuse me, could you bring me the check, please?",
        "isCorrect": true,
        "explanationWhy": "Uso impecable del modal de cortesía 'could' y del término correcto 'the check'."
      },
      {
        "id": "B",
        "text": "Excuse me, can you give me the account please?",
        "isCorrect": false,
        "explanationWhy": "'Account' es una cuenta bancaria o de usuario, no la cuenta a pagar en un restaurante."
      },
      {
        "id": "C",
        "text": "I want paying the food now.",
        "isCorrect": false,
        "explanationWhy": "Error gramatical grave ('want paying' en vez de 'want to pay') y tono descortés."
      },
      {
        "id": "D",
        "text": "Bring me the count, waiter.",
        "isCorrect": false,
        "explanationWhy": "'Count' es el acto de contar o un título nobiliario (conde), no la cuenta."
      }
    ]
  },
  {
    "prompt": "Si un bate y una pelota cuestan juntos $1.10 y el bate cuesta $1.00 más que la pelota, ¿cuánto cuesta la pelota?",
    "context": "Test de reflexión cognitiva de Shane Frederick",
    "languageToListen": "es-ES",
    "difficulty": "medio",
    "expectedConcept": "La pelota cuesta 5 centavos ($0.05).",
    "options": [
      {
        "id": "A",
        "text": "10 centavos ($0.10)",
        "isCorrect": false,
        "explanationWhy": "La trampa intuitiva clásica: si la pelota fuera $0.10 y el bate $1 más ($1.10), juntos sumarían $1.20."
      },
      {
        "id": "B",
        "text": "5 centavos ($0.05)",
        "isCorrect": true,
        "explanationWhy": "Álgebra pura: x + (x + 1.00) = 1.10 => 2x = 0.10 => x = 0.05."
      },
      {
        "id": "C",
        "text": "1 centavo ($0.01)",
        "isCorrect": false,
        "explanationWhy": "Si costara 1 centavo, el bate costaría $1.01 y sumarían $1.02."
      },
      {
        "id": "D",
        "text": "15 centavos ($0.15)",
        "isCorrect": false,
        "explanationWhy": "Cálculo completamente aleatorio."
      }
    ]
  }
]`;

export const SAMPLE_CSV_TEMPLATE = `pregunta,opcion_a,opcion_b,opcion_c,opcion_d,correcta,explicacion,idioma_respuesta
"Dile al camarero con cortesía: ¿podría traerme la cuenta?","Excuse me, could you bring me the check, please?","Can you give me the account please?","I want paying the food now","Bring me the count","A","En restaurantes se usa check o bill, nunca account","en-US"
"Explica en pasado: Ayer no fui al concierto porque me sentía muy cansado","Yesterday I didn't go to the concert because I felt very tired","Yesterday I don't went to the concert","Yesterday I not went because tired","Yesterday I didn't went to concert","A","Uso correcto de didn't go sin pasado doble","en-US"
"Si un bate y una pelota cuestan juntos $1.10 y el bate cuesta $1 más que la pelota, ¿cuánto cuesta la pelota?","5 centavos ($0.05)","10 centavos ($0.10)","1 centavo ($0.01)","20 centavos ($0.20)","A","x + (x + 1) = 1.10 => 2x = 0.10 => x = 0.05","es-ES"`;

export const SAMPLE_TXT_TEMPLATE = `PREGUNTA: Dile al camarero con cortesía: "Disculpe, ¿podría traerme la cuenta, por favor?"
A) Excuse me, could you bring me the check, please? [CORRECTA]
B) Excuse me, can you give me the account please?
C) I want paying the food now.
D) Bring me the count, waiter.
EXPLICACION: En restaurantes en inglés se pide "the check" o "the bill". "Account" es cuenta bancaria.
IDIOMA: en-US
---
PREGUNTA: Si un bate y una pelota cuestan juntos $1.10 y el bate cuesta $1 más que la pelota, ¿cuánto cuesta la pelota?
A) 10 centavos ($0.10)
B) 5 centavos ($0.05) [CORRECTA]
C) 1 centavo ($0.01)
D) 15 centavos ($0.15)
EXPLICACION: Si fuera 10 centavos, el bate costaría 1.10 y sumarían 1.20. La respuesta es 5 centavos.
IDIOMA: es-ES`;

export const importService = {
  /**
   * Parse content automatically by detecting format (JSON, CSV, or Text/Markdown)
   */
  parseDocument(content: string, targetModuleId: string = 'tema_libre'): ImportResult {
    const trimmed = content.trim();
    if (!trimmed) {
      return { success: false, questions: [], errors: ['El documento está vacío.'], totalParsed: 0 };
    }

    // Try JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return this.parseJSON(trimmed, targetModuleId);
    }

    // Try CSV (look for commas in first row or header)
    const firstLine = trimmed.split('\n')[0].toLowerCase();
    if (firstLine.includes(',') && (firstLine.includes('pregunta') || firstLine.includes('opcion') || firstLine.includes('question'))) {
      return this.parseCSV(trimmed, targetModuleId);
    }

    // Fallback to text/markdown format
    return this.parseTextMarkdown(trimmed, targetModuleId);
  },

  parseJSON(jsonText: string, targetModuleId: string): ImportResult {
    try {
      const raw = JSON.parse(jsonText);
      const items = Array.isArray(raw) ? raw : [raw];
      const questions: QuestionItem[] = [];
      const errors: string[] = [];

      items.forEach((item, index) => {
        if (!item.prompt && !item.pregunta) {
          errors.push(`Elemento #${index + 1}: falta el campo 'prompt' o 'pregunta'.`);
          return;
        }

        const prompt = item.prompt || item.pregunta;
        const expectedConcept = item.expectedConcept || item.respuesta_correcta || item.concepto || prompt;
        const languageToListen = item.languageToListen || item.idioma || (prompt.match(/[a-zA-Z]/) ? 'en-US' : 'es-ES');

        let options: MultipleChoiceOption[] | undefined = undefined;
        if (Array.isArray(item.options) && item.options.length > 0) {
          options = item.options.map((opt: any, optIdx: number) => ({
            id: opt.id || String.fromCharCode(65 + optIdx),
            text: opt.text || opt.texto || String(opt),
            isCorrect: Boolean(opt.isCorrect || opt.es_correcta),
            explanationWhy: opt.explanationWhy || opt.explicacion,
          }));
        }

        questions.push({
          id: `imp_${Date.now()}_${index}`,
          moduleId: targetModuleId,
          prompt,
          context: item.context || item.contexto,
          languageToListen: languageToListen === 'es-ES' ? 'es-ES' : 'en-US',
          difficulty: item.difficulty || 'medio',
          expectedConcept,
          acceptedPatterns: item.acceptedPatterns || [expectedConcept],
          options,
        });
      });

      return {
        success: questions.length > 0,
        questions,
        errors,
        totalParsed: questions.length,
      };
    } catch (err: any) {
      return { success: false, questions: [], errors: [`Error de sintaxis JSON: ${err.message}`], totalParsed: 0 };
    }
  },

  parseCSV(csvText: string, targetModuleId: string): ImportResult {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, questions: [], errors: ['El archivo CSV debe tener al menos la cabecera y una fila de datos.'], totalParsed: 0 };
    }

    const questions: QuestionItem[] = [];
    const errors: string[] = [];

    // Simple robust CSV line splitter that respects quoted commas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    // Optional header row parse
    parseCSVLine(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 2) continue;

      const prompt = row[0];
      const optA = row[1] || '';
      const optB = row[2] || '';
      const optC = row[3] || '';
      const optD = row[4] || '';
      const correctCol = (row[5] || 'A').toUpperCase();
      const explanation = row[6] || '';
      const lang = (row[7] || (prompt.includes('¿') ? 'es-ES' : 'en-US')) as 'es-ES' | 'en-US';

      const options: MultipleChoiceOption[] = [];
      if (optA) options.push({ id: 'A', text: optA, isCorrect: correctCol === 'A', explanationWhy: correctCol === 'A' ? explanation : undefined });
      if (optB) options.push({ id: 'B', text: optB, isCorrect: correctCol === 'B', explanationWhy: correctCol === 'B' ? explanation : undefined });
      if (optC) options.push({ id: 'C', text: optC, isCorrect: correctCol === 'C', explanationWhy: correctCol === 'C' ? explanation : undefined });
      if (optD) options.push({ id: 'D', text: optD, isCorrect: correctCol === 'D', explanationWhy: correctCol === 'D' ? explanation : undefined });

      const correctOpt = options.find(o => o.isCorrect) || options[0];

      questions.push({
        id: `csv_${Date.now()}_${i}`,
        moduleId: targetModuleId,
        prompt,
        context: explanation,
        languageToListen: lang === 'es-ES' ? 'es-ES' : 'en-US',
        difficulty: 'medio',
        expectedConcept: correctOpt ? correctOpt.text : prompt,
        options: options.length > 0 ? options : undefined,
      });
    }

    return {
      success: questions.length > 0,
      questions,
      errors,
      totalParsed: questions.length,
    };
  },

  parseTextMarkdown(text: string, targetModuleId: string): ImportResult {
    const blocks = text.split(/---+|\n\s*\n/).filter(b => b.trim().length > 0);
    const questions: QuestionItem[] = [];
    const errors: string[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let prompt = '';
      let explanation = '';
      let lang: 'en-US' | 'es-ES' = 'en-US';
      const options: MultipleChoiceOption[] = [];

      for (const line of lines) {
        if (/^(pregunta|question|p|q):\s*/i.test(line)) {
          prompt = line.replace(/^(pregunta|question|p|q):\s*/i, '').trim();
        } else if (/^[A-D]\)\s*/i.test(line)) {
          const letter = line.charAt(0).toUpperCase();
          const isCorrect = /\[(correcta|correct|x|ok)\]/i.test(line);
          const cleanText = line.replace(/^[A-D]\)\s*/i, '').replace(/\[.*?\]/g, '').trim();
          options.push({
            id: letter,
            text: cleanText,
            isCorrect,
          });
        } else if (/^(explicacion|explanation|por que):\s*/i.test(line)) {
          explanation = line.replace(/^(explicacion|explanation|por que):\s*/i, '').trim();
        } else if (/^(idioma|language|lang):\s*/i.test(line)) {
          const l = line.replace(/^(idioma|language|lang):\s*/i, '').toLowerCase();
          lang = l.includes('es') ? 'es-ES' : 'en-US';
        } else if (!prompt && lines.indexOf(line) === 0) {
          prompt = line;
        }
      }

      if (prompt) {
        const correctOpt = options.find(o => o.isCorrect) || options[0];
        questions.push({
          id: `txt_${Date.now()}_${idx}`,
          moduleId: targetModuleId,
          prompt,
          context: explanation,
          languageToListen: lang,
          difficulty: 'medio',
          expectedConcept: correctOpt ? correctOpt.text : prompt,
          options: options.length > 0 ? options : undefined,
        });
      }
    });

    return {
      success: questions.length > 0,
      questions,
      errors,
      totalParsed: questions.length,
    };
  }
};
