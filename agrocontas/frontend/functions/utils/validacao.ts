import { ServiceError } from "./serviceError";

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function limpar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : "";
}

export function textoObrigatorio(valor: unknown, campo: string, max: number): string {
  const texto = limpar(valor);
  if (!texto) throw new ServiceError(`O campo "${campo}" é obrigatório.`);
  if (texto.length > max) throw new ServiceError(`O campo "${campo}" aceita no máximo ${max} caracteres.`);
  return texto;
}

export function textoOpcional(valor: unknown, campo: string, max: number): string | null {
  const texto = limpar(valor);
  if (!texto) return null;
  if (texto.length > max) throw new ServiceError(`O campo "${campo}" aceita no máximo ${max} caracteres.`);
  return texto;
}

export function opcaoValida<T extends string>(valor: unknown, opcoes: readonly T[], campo: string): T {
  if (typeof valor !== "string" || !opcoes.includes(valor as T)) {
    throw new ServiceError(`Valor inválido para "${campo}". Opções: ${opcoes.join(", ")}.`);
  }
  return valor as T;
}

export function idValido(valor: unknown, campo = "id"): number {
  const numero = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero < 1) {
    throw new ServiceError(`Identificador inválido para "${campo}".`);
  }
  return numero;
}

export function dataValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !DATA_ISO.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(valor);
}

export function dataObrigatoria(valor: unknown, campo: string): string {
  if (!dataValida(valor)) throw new ServiceError(`Data inválida em "${campo}" (esperado AAAA-MM-DD).`);
  return valor;
}

export function valorPositivo(valor: unknown, campo: string): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) {
    throw new ServiceError(`O campo "${campo}" deve ser um valor maior que zero.`);
  }
  return arredondar(valor);
}

export function formatarCpfCnpj(valor: unknown, rotulo = "CPF/CNPJ"): {
  cpfCnpj: string;
  tipoPessoa: "FISICA" | "JURIDICA";
} {
  const digitos = (typeof valor === "string" ? valor : "").replace(/\D/g, "");
  if (digitos.length === 11) {
    return {
      cpfCnpj: digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
      tipoPessoa: "FISICA",
    };
  }
  if (digitos.length === 14) {
    return {
      cpfCnpj: digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
      tipoPessoa: "JURIDICA",
    };
  }
  throw new ServiceError(`${rotulo} inválido: informe 11 (CPF) ou 14 (CNPJ) dígitos.`);
}

export function padraoLike(termo: string): string {
  return `%${termo.replace(/[\\%_]/g, "\\$&")}%`;
}
