const PASSWORD_MIN_LENGTH = 12;

export type PasswordPolicyIssue =
  | "min_length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "special_character";

export type PasswordPolicyResult = {
  ok: boolean;
  issues: PasswordPolicyIssue[];
};

const passwordIssueMessages: Record<PasswordPolicyIssue, string> = {
  min_length: `au moins ${PASSWORD_MIN_LENGTH} caracteres`,
  uppercase: "au moins une lettre majuscule",
  lowercase: "au moins une lettre minuscule",
  number: "au moins un chiffre",
  special_character: "au moins un caractere special",
};

export function validatePasswordStrength(password: string): PasswordPolicyResult {
  const issues: PasswordPolicyIssue[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push("min_length");
  }

  if (!/[A-Z]/.test(password)) {
    issues.push("uppercase");
  }

  if (!/[a-z]/.test(password)) {
    issues.push("lowercase");
  }

  if (!/[0-9]/.test(password)) {
    issues.push("number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push("special_character");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}

export function getPasswordPolicyDescription() {
  return `Le mot de passe doit contenir ${Object.values(passwordIssueMessages).join(", ")}.`;
}

export function assertPasswordStrength(password: string, source = "password") {
  const result = validatePasswordStrength(password);

  if (result.ok) {
    return;
  }

  const details = result.issues.map((issue) => passwordIssueMessages[issue]).join(", ");
  throw new Error(`La valeur ${source} ne respecte pas la politique de mot de passe: ${details}.`);
}

