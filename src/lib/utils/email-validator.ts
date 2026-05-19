export interface EmailValidationResult {
  isValid: boolean;
  feedback: string | null;
}

const WEAK_EMAIL_PREFIXES = [
  "abc",
  "qwerty",
  "asdf",
  "test",
  "testing",
  "admin",
  "user",
  "dummy",
  "temp",
  "mail",
  "hello",
  "xyz",
  "123",
  "123456",
  "placeholder",
  "demo",
  "noreply",
  "no-reply",
];

const DISPOSABLE_EMAIL_DOMAINS = [
  "example.com",
  "test.com",
  "domain.com",
  "mail.com",
  "temp.com",
  "dummy.com",
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "10minutemail.com",
  "sharklasers.com",
  "guerrillamail.com",
  "dispostable.com",
  "getairmail.com",
  "burnermail.io",
  "trashmail.com",
  "minafter.com",
];

export function validateEmail(email: string): EmailValidationResult {
  const result: EmailValidationResult = {
    isValid: false,
    feedback: null,
  };

  if (!email) {
    result.feedback = "Email address cannot be empty";
    return result;
  }

  // 1. Structural Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    result.feedback =
      "Please enter a valid email structure (e.g. you@domain.com)";
    return result;
  }

  const emailLower = email.toLowerCase().trim();
  const [prefix, domain] = emailLower.split("@");

  // 2. Minimum length check for username prefix
  if (prefix.length < 3) {
    result.feedback = "Email prefix must be at least 3 characters long";
    return result;
  }

  // 3. Prevent junk email username prefixes (e.g., abc@, qwerty@)
  if (WEAK_EMAIL_PREFIXES.includes(prefix)) {
    result.feedback = `"${prefix}" is not permitted as a secure email address prefix`;
    return result;
  }

  // 4. Prevent disposable/junk domains
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    result.feedback =
      "Disposable or standard placeholder email domains are not allowed";
    return result;
  }

  result.isValid = true;
  return result;
}
