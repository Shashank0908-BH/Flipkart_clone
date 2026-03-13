const PHONE_NUMBER_REGEX = /^\d{10}$/;
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export function isValidPhoneNumber(value: string) {
  return PHONE_NUMBER_REGEX.test(value.trim());
}

export function isValidEmail(value: string) {
  return EMAIL_FORMAT_REGEX.test(value.trim());
}

export function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function normalizePhoneOrEmailInput(value: string) {
  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  return normalizePhoneInput(trimmed);
}

export function getPhoneOrEmailValidationError(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Enter a 10-digit mobile number or a valid email address.";
  }

  if (trimmed.includes("@")) {
    return isValidEmail(trimmed) ? "" : "Enter a valid email address like name@example.com.";
  }

  return isValidPhoneNumber(trimmed) ? "" : "Enter a valid 10-digit mobile number.";
}

export function getPhoneValidationError(value: string, label = "phone number") {
  if (!value.trim()) {
    return `Enter a ${label}.`;
  }

  return isValidPhoneNumber(value) ? "" : `Enter a valid 10-digit ${label}.`;
}
