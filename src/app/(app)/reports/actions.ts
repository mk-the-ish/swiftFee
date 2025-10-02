'use server';

import { generateFinancialStatements } from '@/ai/flows/generate-financial-statements';
import { z } from 'zod';

const actionSchema = z.object({
  criteria: z.string(),
});

type ActionResponse = {
  statement?: string;
  error?: string;
}

export async function generateFinancialStatementAction(input: { criteria: string }): Promise<ActionResponse> {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await generateFinancialStatements({ criteria: parsed.data.criteria });
    return { statement: result.statement };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate financial statement. Please try again.' };
  }
}
