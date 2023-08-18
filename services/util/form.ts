export function getNestedFormData(form: HTMLFormElement): any {
  const data = new FormData(form);
  const config: any = {};

  for (const [key, value] of (data as any).entries()) {
    const parts = key.split(".");
    const last = parts.pop();
    let obj = config;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!obj[part]) {
        obj[part] = parts[i + 1] === "0" ? [] : {};
      }
      obj = obj[part];
    }
    const resolvedValue = Number.isNaN(parseFloat(value)) ? value : parseFloat(value);
    if (last.endsWith("[]")) {
      const lastActual = last.slice(0, -2);
      (obj[lastActual] ??= []).push(resolvedValue);
    } else {
      obj[last] = resolvedValue;
    }
  }

  return config;
}