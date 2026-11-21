export type LocalUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type StoredAccount = LocalUser & {
  password: string;
};

const ACCOUNT_KEY = "studio-pap-account";
const SESSION_KEY = "studio-pap-session";

export function getStoredAccount(): StoredAccount | null {
  const raw = localStorage.getItem(ACCOUNT_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAccount;
  } catch {
    return null;
  }
}

export function createAccount(
  name: string,
  email: string,
  password: string,
): LocalUser {
  const normalizedEmail = email.trim().toLowerCase();

  if (!name.trim()) {
    throw new Error("Please enter your name.");
  }

  if (!normalizedEmail.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (getStoredAccount()) {
    throw new Error("An account already exists on this device.");
  }

  const account: StoredAccount = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  localStorage.setItem(SESSION_KEY, account.id);

  return stripPassword(account);
}

export function login(
  email: string,
  password: string,
): LocalUser {
  const account = getStoredAccount();

  if (!account) {
    throw new Error("No account exists yet. Create an account first.");
  }

  if (
    account.email !== email.trim().toLowerCase() ||
    account.password !== password
  ) {
    throw new Error("Incorrect email or password.");
  }

  localStorage.setItem(SESSION_KEY, account.id);

  return stripPassword(account);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): LocalUser | null {
  const account = getStoredAccount();
  const sessionId = localStorage.getItem(SESSION_KEY);

  if (!account || sessionId !== account.id) {
    return null;
  }

  return stripPassword(account);
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

function stripPassword(account: StoredAccount): LocalUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
  };
}