/**
 * Validation Rule Formula Engine
 * 
 * Evaluates formula expressions against record data.
 * Supports:
 *   - Comparison operators: ==, !=, >, <, >=, <=
 *   - Logical operators: AND, OR, NOT
 *   - Built-in functions: ISBLANK(), NOW(), LEN(), CONTAINS(), BEGINS(), REGEX(), IF(), TODAY()
 *   - Field references: field_name (resolved from record data)
 *   - Literals: strings ('...'), numbers, booleans (true/false)
 * 
 * A formula returning TRUE means the validation ERROR condition is met (record is invalid).
 * A formula returning FALSE means the record is valid.
 */

// Token types for the lexer
type TokenType =
    | 'NUMBER' | 'STRING' | 'BOOLEAN' | 'IDENTIFIER' | 'FUNCTION'
    | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA'
    | 'AND' | 'OR' | 'NOT' | 'EOF';

interface Token {
    type: TokenType;
    value: string | number | boolean;
}

// Tokenizer
function tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
        // Skip whitespace
        if (/\s/.test(formula[i])) {
            i++;
            continue;
        }

        // String literals
        if (formula[i] === "'" || formula[i] === '"') {
            const quote = formula[i];
            i++;
            let str = '';
            while (i < formula.length && formula[i] !== quote) {
                if (formula[i] === '\\') {
                    i++;
                    if (i < formula.length) str += formula[i];
                } else {
                    str += formula[i];
                }
                i++;
            }
            i++; // skip closing quote
            tokens.push({ type: 'STRING', value: str });
            continue;
        }

        // Numbers
        if (/\d/.test(formula[i]) || (formula[i] === '-' && i + 1 < formula.length && /\d/.test(formula[i + 1]))) {
            let num = '';
            if (formula[i] === '-') {
                num = '-';
                i++;
            }
            while (i < formula.length && /[\d.]/.test(formula[i])) {
                num += formula[i];
                i++;
            }
            tokens.push({ type: 'NUMBER', value: parseFloat(num) });
            continue;
        }

        // Operators
        if (formula[i] === '=' && formula[i + 1] === '=') {
            tokens.push({ type: 'OPERATOR', value: '==' });
            i += 2;
            continue;
        }
        if (formula[i] === '!' && formula[i + 1] === '=') {
            tokens.push({ type: 'OPERATOR', value: '!=' });
            i += 2;
            continue;
        }
        if (formula[i] === '>' && formula[i + 1] === '=') {
            tokens.push({ type: 'OPERATOR', value: '>=' });
            i += 2;
            continue;
        }
        if (formula[i] === '<' && formula[i + 1] === '=') {
            tokens.push({ type: 'OPERATOR', value: '<=' });
            i += 2;
            continue;
        }
        if (formula[i] === '>') {
            tokens.push({ type: 'OPERATOR', value: '>' });
            i++;
            continue;
        }
        if (formula[i] === '<') {
            tokens.push({ type: 'OPERATOR', value: '<' });
            i++;
            continue;
        }

        // Parentheses and comma
        if (formula[i] === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
            i++;
            continue;
        }
        if (formula[i] === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
            i++;
            continue;
        }
        if (formula[i] === ',') {
            tokens.push({ type: 'COMMA', value: ',' });
            i++;
            continue;
        }

        // Identifiers, keywords, and functions
        if (/[a-zA-Z_]/.test(formula[i])) {
            let ident = '';
            while (i < formula.length && /[a-zA-Z0-9_.]/.test(formula[i])) {
                ident += formula[i];
                i++;
            }

            const upper = ident.toUpperCase();
            if (upper === 'AND') {
                tokens.push({ type: 'AND', value: 'AND' });
            } else if (upper === 'OR') {
                tokens.push({ type: 'OR', value: 'OR' });
            } else if (upper === 'NOT') {
                tokens.push({ type: 'NOT', value: 'NOT' });
            } else if (upper === 'TRUE') {
                tokens.push({ type: 'BOOLEAN', value: true });
            } else if (upper === 'FALSE') {
                tokens.push({ type: 'BOOLEAN', value: false });
            } else if (i < formula.length && formula[i] === '(') {
                // It's a function call
                tokens.push({ type: 'FUNCTION', value: upper });
            } else {
                tokens.push({ type: 'IDENTIFIER', value: ident });
            }
            continue;
        }

        // Unknown character — skip
        i++;
    }

    tokens.push({ type: 'EOF', value: '' });
    return tokens;
}

// Parser: Recursive descent parser for formula expressions
class FormulaParser {
    private tokens: Token[];
    private pos: number;
    private record: Record<string, unknown>;

    constructor(tokens: Token[], record: Record<string, unknown>) {
        this.tokens = tokens;
        this.pos = 0;
        this.record = record;
    }

    private peek(): Token {
        return this.tokens[this.pos] || { type: 'EOF', value: '' };
    }

    private consume(expectedType?: TokenType): Token {
        const token = this.tokens[this.pos];
        if (expectedType && token.type !== expectedType) {
            throw new Error(`Expected ${expectedType} but got ${token.type} (value: ${token.value})`);
        }
        this.pos++;
        return token;
    }

    parse(): unknown {
        const result = this.parseOr();
        return result;
    }

    private parseOr(): unknown {
        let left = this.parseAnd();
        while (this.peek().type === 'OR') {
            this.consume();
            const right = this.parseAnd();
            left = Boolean(left) || Boolean(right);
        }
        return left;
    }

    private parseAnd(): unknown {
        let left = this.parseNot();
        while (this.peek().type === 'AND') {
            this.consume();
            const right = this.parseNot();
            left = Boolean(left) && Boolean(right);
        }
        return left;
    }

    private parseNot(): unknown {
        if (this.peek().type === 'NOT') {
            this.consume();
            const value = this.parseComparison();
            return !Boolean(value);
        }
        return this.parseComparison();
    }

    private parseComparison(): unknown {
        const left = this.parsePrimary();

        if (this.peek().type === 'OPERATOR') {
            const op = this.consume().value as string;
            const right = this.parsePrimary();
            return this.compare(left, op, right);
        }

        return left;
    }

    private compare(left: unknown, op: string, right: unknown): boolean {
        // Handle numeric comparison
        const numLeft = Number(left);
        const numRight = Number(right);
        const bothNumeric = !isNaN(numLeft) && !isNaN(numRight) && left !== '' && right !== '';

        switch (op) {
            case '==':
                return String(left) === String(right);
            case '!=':
                return String(left) !== String(right);
            case '>':
                if (bothNumeric) return numLeft > numRight;
                if (left instanceof Date && right instanceof Date) return left > right;
                return String(left) > String(right);
            case '<':
                if (bothNumeric) return numLeft < numRight;
                if (left instanceof Date && right instanceof Date) return left < right;
                return String(left) < String(right);
            case '>=':
                if (bothNumeric) return numLeft >= numRight;
                return String(left) >= String(right);
            case '<=':
                if (bothNumeric) return numLeft <= numRight;
                return String(left) <= String(right);
            default:
                throw new Error(`Unknown operator: ${op}`);
        }
    }

    private parsePrimary(): unknown {
        const token = this.peek();

        switch (token.type) {
            case 'NUMBER':
                this.consume();
                return token.value;

            case 'STRING':
                this.consume();
                return token.value;

            case 'BOOLEAN':
                this.consume();
                return token.value;

            case 'FUNCTION':
                return this.parseFunction();

            case 'IDENTIFIER':
                this.consume();
                return this.resolveField(token.value as string);

            case 'LPAREN':
                this.consume(); // consume (
                const expr = this.parseOr();
                this.consume('RPAREN'); // consume )
                return expr;

            case 'NOT':
                return this.parseNot();

            default:
                throw new Error(`Unexpected token: ${token.type} (value: ${token.value})`);
        }
    }

    private parseFunction(): unknown {
        const funcName = this.consume('FUNCTION').value as string;
        this.consume('LPAREN');

        const args: unknown[] = [];
        if (this.peek().type !== 'RPAREN') {
            args.push(this.parseOr());
            while (this.peek().type === 'COMMA') {
                this.consume(); // consume comma
                args.push(this.parseOr());
            }
        }
        this.consume('RPAREN');

        return this.executeFunction(funcName, args);
    }

    private executeFunction(name: string, args: unknown[]): unknown {
        switch (name) {
            case 'ISBLANK':
                return this.isBlank(args[0]);
            case 'NOT_BLANK':
                return !this.isBlank(args[0]);
            case 'NOW':
                return new Date();
            case 'TODAY':
                return new Date(new Date().toDateString());
            case 'LEN':
                return String(args[0] ?? '').length;
            case 'CONTAINS':
                return String(args[0] ?? '').toLowerCase().includes(String(args[1] ?? '').toLowerCase());
            case 'BEGINS':
                return String(args[0] ?? '').toLowerCase().startsWith(String(args[1] ?? '').toLowerCase());
            case 'ENDS':
                return String(args[0] ?? '').toLowerCase().endsWith(String(args[1] ?? '').toLowerCase());
            case 'REGEX':
                try {
                    const regex = new RegExp(String(args[1] ?? ''));
                    return regex.test(String(args[0] ?? ''));
                } catch {
                    return false;
                }
            case 'IF':
                return Boolean(args[0]) ? args[1] : args[2];
            case 'ABS':
                return Math.abs(Number(args[0] ?? 0));
            case 'MAX':
                return Math.max(Number(args[0] ?? 0), Number(args[1] ?? 0));
            case 'MIN':
                return Math.min(Number(args[0] ?? 0), Number(args[1] ?? 0));
            case 'UPPER':
                return String(args[0] ?? '').toUpperCase();
            case 'LOWER':
                return String(args[0] ?? '').toLowerCase();
            case 'TRIM':
                return String(args[0] ?? '').trim();
            case 'LEFT':
                return String(args[0] ?? '').substring(0, Number(args[1] ?? 0));
            case 'RIGHT': {
                const s = String(args[0] ?? '');
                const n = Number(args[1] ?? 0);
                return s.substring(s.length - n);
            }
            case 'ISNUMBER':
                return !isNaN(Number(args[0])) && args[0] !== '' && args[0] !== null && args[0] !== undefined;
            case 'TEXT':
                return String(args[0] ?? '');
            case 'VALUE':
                return Number(args[0] ?? 0);
            case 'YEAR': {
                const d = args[0] instanceof Date ? args[0] : new Date(String(args[0] ?? ''));
                return d.getFullYear();
            }
            case 'MONTH': {
                const d = args[0] instanceof Date ? args[0] : new Date(String(args[0] ?? ''));
                return d.getMonth() + 1;
            }
            case 'DAY': {
                const d = args[0] instanceof Date ? args[0] : new Date(String(args[0] ?? ''));
                return d.getDate();
            }
            default:
                throw new Error(`Unknown function: ${name}`);
        }
    }

    private isBlank(value: unknown): boolean {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        return false;
    }

    private resolveField(fieldName: string): unknown {
        // Support nested fields with dot notation: "account.name"
        const parts = fieldName.split('.');
        let current: unknown = this.record;
        for (const part of parts) {
            if (current === null || current === undefined) return null;
            if (typeof current === 'object') {
                current = (current as Record<string, unknown>)[part];
            } else {
                return null;
            }
        }

        // Auto-convert date strings
        if (typeof current === 'string') {
            const dateVal = new Date(current);
            if (!isNaN(dateVal.getTime()) && current.match(/\d{4}-\d{2}-\d{2}/)) {
                return dateVal;
            }
        }

        return current;
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface ValidationResult {
    isValid: boolean;
    errors: {
        ruleName: string;
        ruleId: string;
        message: string;
    }[];
}

/**
 * Evaluate a single formula against record data.
 * Returns TRUE if the error condition is met (record is INVALID).
 */
export function evaluateFormula(formula: string, record: Record<string, unknown>): boolean {
    try {
        const tokens = tokenize(formula);
        const parser = new FormulaParser(tokens, record);
        const result = parser.parse();
        return Boolean(result);
    } catch (error) {
        console.error(`Formula evaluation error for "${formula}":`, error);
        // If formula fails to parse, don't block the user — return false (valid)
        return false;
    }
}

/**
 * Run all active validation rules for a given object type against record data.
 * Returns a ValidationResult with pass/fail and error messages.
 */
export async function validateRecord(
    objectType: string,
    record: Record<string, unknown>,
    teamId: string,
    context: 'SAVE' | 'CREATE_ONLY' | 'UPDATE_ONLY' = 'SAVE'
): Promise<ValidationResult> {
    // Dynamic import to avoid circular deps
    const { prismadb } = await import("@/lib/prisma");

    const rules = await prismadb.validationRule.findMany({
        where: {
            team_id: teamId,
            object_type: objectType,
            is_active: true,
            OR: [
                { trigger_on: 'SAVE' },
                { trigger_on: context },
            ],
        },
        orderBy: { order: 'asc' },
    });

    const errors: ValidationResult['errors'] = [];

    for (const rule of rules) {
        const isErrorCondition = evaluateFormula(rule.formula, record);
        if (isErrorCondition) {
            errors.push({
                ruleName: rule.name,
                ruleId: rule.id,
                message: rule.error_message,
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Test a formula against sample data without saving.
 * Useful for the admin UI to preview formula behavior.
 */
export function testFormula(formula: string, sampleData: Record<string, unknown>): {
    result: unknown;
    error?: string;
} {
    try {
        const tokens = tokenize(formula);
        const parser = new FormulaParser(tokens, sampleData);
        const result = parser.parse();
        return { result };
    } catch (error) {
        return { result: null, error: (error as Error).message };
    }
}
