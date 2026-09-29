import { ResponseSchema, SchemaType } from "@google/generative-ai";

export const nfeResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  description: "Dados extraídos e classificados da Nota Fiscal de contas a pagar",
  properties: {
    fornecedor: {
      type: SchemaType.OBJECT,
      description: "Dados do fornecedor emitente da nota fiscal",
      properties: {
        razaoSocial: {
          type: SchemaType.STRING,
          description: "Razão social do fornecedor",
        },
        nomeFantasia: {
          type: SchemaType.STRING,
          description: "Nome fantasia do fornecedor",
        },
        cnpj: {
          type: SchemaType.STRING,
          description: "CNPJ do fornecedor",
        },
      },
      required: ["razaoSocial", "cnpj"],
    },
    faturado: {
      type: SchemaType.OBJECT,
      description: "Dados do faturado destinatário da nota",
      properties: {
        nomeCompleto: {
          type: SchemaType.STRING,
          description: "Nome completo do faturado",
        },
        cpf: {
          type: SchemaType.STRING,
          description: "CPF ou CNPJ do faturado",
        },
      },
      required: ["nomeCompleto", "cpf"],
    },
    numeroNotaFiscal: {
      type: SchemaType.STRING,
      description: "Número da nota fiscal",
    },
    dataEmissao: {
      type: SchemaType.STRING,
      description: "Data de emissão no formato YYYY-MM-DD",
    },
    descricaoProdutos: {
      type: SchemaType.STRING,
      description: "Descrição consolidada dos produtos ou serviços",
    },
    quantidadeParcelas: {
      type: SchemaType.INTEGER,
      description: "Quantidade de parcelas",
    },
    dataVencimento: {
      type: SchemaType.STRING,
      description: "Data de vencimento principal no formato YYYY-MM-DD",
    },
    valorTotal: {
      type: SchemaType.NUMBER,
      description: "Valor total em reais",
    },
    classificacaoDespesa: {
      type: SchemaType.STRING,
      description: "Classificação da categoria principal da despesa",
    },
    classificacoesDespesa: {
      type: SchemaType.ARRAY,
      description: "Lista de classificações de despesa",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          categoria: {
            type: SchemaType.STRING,
            description: "Nome da categoria principal",
          },
          subcategoria: {
            type: SchemaType.STRING,
            description: "Nome da subcategoria",
          },
          justificativa: {
            type: SchemaType.STRING,
            description: "Justificativa da classificação",
          },
        },
        required: ["categoria"],
      },
    },
    parcelas: {
      type: SchemaType.ARRAY,
      description: "Lista de parcelas",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          numero: {
            type: SchemaType.INTEGER,
            description: "Número sequencial da parcela",
          },
          dataVencimento: {
            type: SchemaType.STRING,
            description: "Data de vencimento no formato YYYY-MM-DD",
          },
          valor: {
            type: SchemaType.NUMBER,
            description: "Valor da parcela em reais",
          },
        },
        required: ["numero", "dataVencimento", "valor"],
      },
    },
  },
  required: [
    "fornecedor",
    "faturado",
    "numeroNotaFiscal",
    "dataEmissao",
    "descricaoProdutos",
    "quantidadeParcelas",
    "dataVencimento",
    "valorTotal",
    "classificacaoDespesa",
    "classificacoesDespesa",
    "parcelas",
  ],
};
