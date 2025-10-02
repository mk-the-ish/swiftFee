'use server';

/**
 * @fileOverview Flow for generating financial statements.
 *
 * - generateFinancialStatements - A function that generates financial statements based on provided criteria.
 * - GenerateFinancialStatementsInput - The input type for the generateFinancialStatements function.
 * - GenerateFinancialStatementsOutput - The return type for the generateFinancialStatements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialStatementsInputSchema = z.object({
  criteria: z
    .string()
    .describe(
      'Criteria for generating the financial statements, such as fee type, date range, and bank account.'
    ),
});
export type GenerateFinancialStatementsInput = z.infer<
  typeof GenerateFinancialStatementsInputSchema
>;

const GenerateFinancialStatementsOutputSchema = z.object({
  statement: z
    .string()
    .describe('The generated financial statement in a human-readable format.'),
});
export type GenerateFinancialStatementsOutput = z.infer<
  typeof GenerateFinancialStatementsOutputSchema
>;

export async function generateFinancialStatements(
  input: GenerateFinancialStatementsInput
): Promise<GenerateFinancialStatementsOutput> {
  return generateFinancialStatementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialStatementsPrompt',
  input: {schema: GenerateFinancialStatementsInputSchema},
  output: {schema: GenerateFinancialStatementsOutputSchema},
  prompt: `You are an expert financial analyst specializing in school finances.

  Generate a financial statement based on the following criteria: {{{criteria}}}
  Make sure to present the information in a clear and concise manner.
  Include all relevant financial data and calculations.
  `, // Ensure criteria is used in the prompt
});

const generateFinancialStatementsFlow = ai.defineFlow(
  {
    name: 'generateFinancialStatementsFlow',
    inputSchema: GenerateFinancialStatementsInputSchema,
    outputSchema: GenerateFinancialStatementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
