export const safeRandomId = (prefix: string = ""): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function") {
    return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  const random = Math.random().toString(36).slice(2, 14).toUpperCase();
  return `${prefix}${random}`;
};

