/**
 * Browser-side check of the contact form, for instant feedback. It mirrors
 * App\Http\Requests\Site\ContactMessageRequest, which stays the authority.
 * Hand-written on purpose: a schema library would triple the home page's JS.
 */
export type ContactFields = { name: string; email: string; subject: string; message: string };

type Rule = { min: number; max: number; tooShort: string; label: string };

const RULES: Record<keyof ContactFields, Rule> = {
    name: { min: 2, max: 120, tooShort: 'Please enter your name.', label: 'Name' },
    email: { min: 1, max: 190, tooShort: 'Please enter a valid email address.', label: 'Email' },
    subject: { min: 3, max: 160, tooShort: 'Please add a short subject.', label: 'Subject' },
    message: { min: 20, max: 5000, tooShort: 'Please write at least 20 characters so I know how to help.', label: 'Message' },
};

// Deliberately loose (one @, a dot in the domain, no spaces); the server does the strict RFC check.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message per invalid field, in form order. Empty when valid. */
export function validateContact(data: ContactFields): Partial<Record<keyof ContactFields, string>> {
    const errors: Partial<Record<keyof ContactFields, string>> = {};

    for (const field of Object.keys(RULES) as (keyof ContactFields)[]) {
        const rule = RULES[field];
        const value = data[field].trim();

        if (value.length < rule.min) {
            errors[field] = rule.tooShort;
        } else if (value.length > rule.max) {
            errors[field] = `${rule.label} can be at most ${rule.max.toLocaleString('en')} characters.`;
        } else if (field === 'email' && !EMAIL.test(value)) {
            errors[field] = RULES.email.tooShort;
        }
    }

    return errors;
}
