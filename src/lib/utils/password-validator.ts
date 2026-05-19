const COMMON_WEAK_PASSWORDS = [
  "123456",
  "12345678",
  "123456789",
  "12345",
  "1234567890",
  "1234",
  "password",
  "qwerty@1234",
  "letmein",
  "admin",
  "admin123",
  "welcome",
  "password123",
  "iloveyou",
  "1234567",
  "111111",
];

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // Strength rating from 0 (weakest) to 4 (strongest)
  feedback: string | null;
  checks: {
    hasMinLength: boolean;
    hasMixedCase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    isNotCommon: boolean;
    doesNotContainEmail: boolean;
  };
}

export function validatePassword(
  password: string,
  email?: string,
): PasswordValidationResult {
  const result: PasswordValidationResult = {
    isValid: false,
    score: 0,
    feedback: null,
    checks: {
      hasMinLength: password.length >= 8,
      hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
      isNotCommon: !COMMON_WEAK_PASSWORDS.includes(password.toLowerCase()),
      doesNotContainEmail: true,
    },
  };

  // --- Overlap Checks with Email / Username ---
  if (email && email.includes("@")) {
    const emailLower = email.toLowerCase();
    const passwordLower = password.toLowerCase();
    const [prefix] = emailLower.split("@");

    if (
      passwordLower.includes(emailLower) ||
      (prefix.length >= 3 && passwordLower.includes(prefix))
    ) {
      result.checks.doesNotContainEmail = false;
    }
  }

  // --- Score Calculation (0 to 4 Rating Scale) ---
  let scorePoints = 0;
  if (result.checks.hasMinLength) scorePoints++;
  if (result.checks.hasMixedCase) scorePoints++;
  if (result.checks.hasNumber) scorePoints++;
  if (result.checks.hasSpecial) scorePoints++;

  result.score = scorePoints;

  // --- Construct User Friendly Detailed Feedback ---
  if (!password) {
    result.feedback = "Password cannot be empty";
  } else if (!result.checks.hasMinLength) {
    result.feedback = "Password must be at least 8 characters long";
  } else if (!result.checks.doesNotContainEmail) {
    result.feedback = "Password cannot contain your email or username";
  } else if (!result.checks.isNotCommon) {
    result.feedback = "This is a commonly used, easily guessable password";
  } else if (!result.checks.hasMixedCase) {
    result.feedback = "Include both uppercase and lowercase letters";
  } else if (!result.checks.hasNumber) {
    result.feedback = "Include at least one number";
  } else if (!result.checks.hasSpecial) {
    result.feedback = "Include at least one special character (e.g. !@#$)";
  }

  // --- Complete Strict Verification Check ---
  result.isValid =
    result.checks.hasMinLength &&
    result.checks.hasMixedCase &&
    result.checks.hasNumber &&
    result.checks.hasSpecial &&
    result.checks.isNotCommon &&
    result.checks.doesNotContainEmail;

  return result;
}
