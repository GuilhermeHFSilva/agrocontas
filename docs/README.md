# Documentação AgroContas — Engenharia de Requisitos (DOO / UniRV)

Este diretório centraliza a documentação de requisitos do projeto **AgroContas**, contendo tanto os artefatos originais submetidos quanto a versão integralmente corrigida e alinhada ao parecer avaliativo do professor da disciplina de **Desenvolvimento Orientado a Objetos (DOO)** da **Universidade de Rio Verde (UniRV)**.

---

## 📁 Estrutura de Arquivos

```text
docs/
├── original/
│   ├── Documentacao_Requisitos_Original.pdf          # Documentação original v1.01 (submissão prévia, higienizada)
│   ├── Avaliacao_Professor.pdf                       # Parecer e apontamentos do professor (higienizado)
│   └── assets/                                       # Diagramas e protótipos extraídos da versão original
│
├── corrigida/
│   ├── AgroContas_Documentacao_Requisitos_v1.0.tex   # Código-fonte LaTeX (padrão abnTeX2)
│   ├── AgroContas_Documentacao_Requisitos_v1.0.pdf   # Documento oficial compilado (31 páginas)
│   ├── assets/                                       # Novos diagramas técnicos e protótipos dos 7 RFs
│   │   ├── arquitetura.png                           # Diagrama de arquitetura em camadas
│   │   ├── diagrama_caso_uso.png                     # Diagrama de Casos de Uso padronizado
│   │   ├── der.png                                   # DER oficial com as 5 entidades e FKs
│   │   ├── gantt.png                                 # Cronograma oficial no padrão GanttProject
│   │   ├── proto_rf01_fornecedor.png                 # Protótipo RF01 (Listagem de Fornecedor/Cliente)
│   │   ├── proto_rf02_despesas.png                   # Protótipo RF02 (Listagem de Despesas/Receitas)
│   │   ├── proto_rf03_contas.png                     # Protótipo RF03 (Listagem de MovimentoContas)
│   │   ├── proto_rf04_listagem.png                   # Protótipo RF04 (Listagem de Parcelas)
│   │   ├── proto_rf04_detalhe.png                    # Protótipo RF04 (Modal de Amortizações)
│   │   ├── proto_rf05_quitacao.png                   # Protótipo RF05 (Listagem de Quitações/Baixas)
│   │   ├── proto_rf06_upload.png                     # Protótipo RF06 (Upload de Documentos PDF)
│   │   ├── proto_rf07_extracao.png                   # Protótipo RF07 (Split-View de Extração e Auditoria)
│   │   ├── seq_quitacao.png                          # Diagrama de Sequência 1 (Quitação)
│   │   └── seq_extracao.png                          # Diagrama de Sequência 2 (Upload/Extração)
│   └── previews/                                     # Imagens PNG de amostragem das páginas do PDF
│
└── README.md                                         # Este relatório comparativo
```

---

## 📊 Matriz de Correções Solicitadas pelo Professor

| Item Avaliado | Versão Original | Parecer do Professor | Versão Corrigida (`v1.0.pdf`) |
| :--- | :--- | :--- | :--- |
| **Histórico de Alterações** | Versão 1.01 | *Desacordo (manter na v1.0)* | **Fixado na Versão 1.0**, registrando formalmente a especificação homologada. |
| **Lista de Funções (Item 2)** | 10 funções misturando IA, Kanban e Open Finance | *Desacordo (espera-se 7 funções essenciais)* | **Padronizado exatamente nas 7 funções**: RF01 a RF07 (Manter Fornecedor/Cliente, Despesas/Receitas, MovimentoContas, MovimentoParcelas, MovimentoFinanceiro, Upload e Extração). |
| **Diagrama de Casos de Uso** | Atores misturados e 10 casos de uso descentralizados | *Desacordo (Casos no centro, Atores nas bordas, mesma quantidade de RFs)* | **Novo diagrama UML**: Atores externos nas bordas laterais, System Boundary "AgroContas" no centro contendo estritamente os **7 Casos de Uso**. |
| **Detalhamento de Casos de Uso** | Apenas 1 caso detalhado (UC04) | *Desacordo (apenas um; dependências a revisar)* | **Detalhamento formal de TODOS os 7 Casos de Uso**, com dependências revisadas e consistentes. |
| **Diagrama Entidade-Relacionamento** | Modelo conceitual alternativo | *Desacordo (espera-se as 5 entidades e FKs específicas)* | **Novo DER normalizado**: 5 entidades (`FORNECEDOR_CLIENTE`, `DESPESAS_RECEITAS`, `MOVIMENTO_CONTAS`, `MOVIMENTO_PARCELAS`, `MOVIMENTO_FINANCEIRO`) com suas FKs explícitas. |
| **Diagrama de Sequência** | 2 diagramas orientados a objetos | *OK (aprovado)* | **Mantidos e referenciados**, preservando o padrão OO e o retorno ao ator. |
| **Diagrama de Gantt** | Gráfico genérico de 8 sprints | *Desacordo (espera-se usar GanttProject)* | **Modelado no GanttProject**, com WBS, IDs de tarefas, predecessoras, durações e exportação gráfica. |
| **Especificação de Casos de Uso** | Especificação apenas do UC04; protótipos incompletos | *Desacordo (faltando protótipo ao fim de cada RF; uma especificação para cada RF; MANTER listagem na 1ª tela)* | **Especificação completa dos 7 RFs no Anexo 2**, com **protótipo visual ao final de CADA RF** e fluxo mandatário de **listagem/DataGrid como a primeira tela** para todas as operações de manutenção. |

---

## 🛠️ Como Recompilar a Documentação LaTeX

Caso sejam necessárias futuras edições no texto-fonte:

```bash
cd docs/corrigida
pdflatex -interaction=nonstopmode AgroContas_Documentacao_Requisitos_v1.0.tex
pdflatex -interaction=nonstopmode AgroContas_Documentacao_Requisitos_v1.0.tex
```

*(O comando é executado duas vezes para garantir a resolução correta de todas as referências cruzadas e do Sumário).*
