-- MEG-Finance demo database schema (SQLite)
-- Mirrors the subset of the PRIMAVERA PRIDEMO tables/columns actually queried
-- by server/backends/*.mjs, so the demo backend can run identical business logic
-- without a real PRIMAVERA/SQL Server installation.

CREATE TABLE Clientes (
  Cliente TEXT UNIQUE NOT NULL,
  Nome TEXT,
  Email TEXT,
  Fac_Tel TEXT,
  NumContrib TEXT,
  Moeda TEXT,
  TotalDeb REAL,
  LimiteCred REAL,
  CondPag TEXT,
  Vendedor TEXT,
  ClienteAnulado INTEGER
);

CREATE TABLE Fornecedores (
  Fornecedor TEXT UNIQUE NOT NULL,
  Nome TEXT,
  NumContrib TEXT
);

CREATE TABLE Artigo (
  Artigo TEXT UNIQUE NOT NULL,
  Descricao TEXT,
  Familia TEXT,
  UnidadeVenda TEXT,
  PCMedio REAL,
  PCUltimo REAL
);

CREATE TABLE CabecDoc (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  TipoDoc TEXT,
  Serie TEXT,
  NumDoc INTEGER,
  Data TEXT,
  DataVencimento TEXT,
  Entidade TEXT,
  TipoEntidade TEXT,
  Moeda TEXT,
  CondPag TEXT,
  RespCobranca TEXT,
  Referencia TEXT,
  TotalDocumento REAL,
  TotalMerc REAL,
  TotalIva REAL,
  TotalDesc REAL
);

CREATE TABLE CabecDocStatus (
  IdCabecDoc INTEGER,
  Anulado INTEGER
);

CREATE TABLE LinhasDoc (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  IdCabecDoc INTEGER,
  NumLinha INTEGER,
  Artigo TEXT,
  Descricao TEXT,
  Quantidade REAL,
  PrecUnit REAL,
  Desconto1 REAL,
  TotalIliquido REAL,
  PrecoLiquido REAL,
  TaxaIva REAL,
  TotalIva REAL,
  Armazem TEXT,
  CustoMercadoriasMBase REAL
);

CREATE TABLE CabecCompras (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  TipoDoc TEXT,
  Serie TEXT,
  NumDoc INTEGER,
  Entidade TEXT,
  DataDoc TEXT,
  DataVencimento TEXT,
  TotalDocumento REAL,
  TotalMerc REAL,
  TotalIva REAL,
  TotalDesc REAL,
  Moeda TEXT,
  CondPag TEXT,
  NumContribuinte TEXT,
  Nome TEXT
);

CREATE TABLE LinhasCompras (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  IdCabecCompras INTEGER,
  NumLinha INTEGER,
  Artigo TEXT,
  Quantidade REAL,
  PrecUnit REAL
);

CREATE TABLE ContasBancarias (
  Conta TEXT UNIQUE NOT NULL,
  DescBanco TEXT,
  Banco TEXT,
  Moeda TEXT,
  TipoConta TEXT,
  Limite REAL
);

CREATE TABLE CabecTesouraria (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  TipoDoc TEXT,
  Serie TEXT,
  NumDoc INTEGER,
  Entidade TEXT,
  TipoEntidade TEXT,
  TotalDebito REAL,
  TotalCredito REAL,
  ContaOrigem TEXT,
  ContaDestino TEXT,
  Moeda TEXT,
  Observacoes TEXT,
  DataUltimaActualizacao TEXT
);

CREATE TABLE Movimentos (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Conta TEXT,
  Natureza TEXT,
  Valor REAL,
  Ano INTEGER,
  Mes INTEGER,
  DataGravacao TEXT,
  Diario TEXT
);

CREATE TABLE PlanoContas (
  Conta TEXT UNIQUE NOT NULL,
  Descricao TEXT
);

CREATE TABLE GPR_OrdemFabrico (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  OrdemFabrico TEXT,
  Artigo TEXT,
  QtOrdemFabrico REAL,
  CustoMateriaisPrevisto REAL,
  CustoMateriaisReal REAL,
  CustoTransformacaoPrevisto REAL,
  CustoTransformacaoReal REAL,
  OutrosCustosPrevito REAL,
  OutrosCustosReal REAL,
  DataOrdemFabrico TEXT,
  Estado INTEGER
);

CREATE TABLE GPR_OrdemFabricoComponentes (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  IDOrdemFabrico INTEGER,
  Componente TEXT,
  QtPrevista REAL,
  QtConsumida REAL,
  Preco REAL
);

CREATE TABLE GPR_OrdemFabricoOperacoes (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  IDOrdemFabrico INTEGER,
  Operacao TEXT,
  TempoPrevisto REAL,
  TempoConsumido REAL,
  CustoOperador REAL,
  CustoMaquina REAL
);

CREATE TABLE INV_ValoresActuaisStock (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Artigo TEXT,
  EstadoStock TEXT,
  Stock REAL,
  DataStock TEXT
);

CREATE TABLE INV_ValoresActuaisCusteio (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Artigo TEXT,
  GrupoCustos TEXT,
  CustoGrpCstMBase REAL,
  CustoGrpCstLotMBase REAL,
  DataCusteio TEXT
);

CREATE TABLE INV_Movimentos (
  Id INTEGER PRIMARY KEY AUTOINCREMENT
);

CREATE TABLE Funcionarios (
  Codigo TEXT UNIQUE NOT NULL,
  Nome TEXT,
  Categoria TEXT,
  Situacao TEXT,
  Vencimento REAL,
  DataAdmissao TEXT,
  DataFimContrato TEXT,
  TipoContrato TEXT,
  Qualificacao TEXT,
  CentroCusto TEXT
);

CREATE TABLE FuncRecibos (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  CodFunc TEXT
);

CREATE TABLE FuncRecibosProcs (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  ReciboID INTEGER,
  TotalDeRemuneracoes REAL,
  TotalDeDescontos REAL,
  TotalLiquido REAL
);

CREATE TABLE RHP_Ferias (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  CodFunc TEXT,
  DataInicio TEXT,
  DataFim TEXT
);

CREATE TABLE RHP_HistoricoRegistoVinculo (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  CodFunc TEXT,
  DataFim TEXT
);

CREATE TABLE Contactos (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Nome TEXT,
  Email TEXT,
  Telefone TEXT,
  Empresa TEXT
);

CREATE TABLE Armazens (
  Codigo TEXT PRIMARY KEY,
  Descricao TEXT
);

CREATE TABLE Vendedores (
  Codigo TEXT PRIMARY KEY,
  Nome TEXT
);

CREATE TABLE VersaoModulo (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Modulo TEXT
);

CREATE TABLE DocumentosCCT (
  Id INTEGER PRIMARY KEY AUTOINCREMENT
);

CREATE INDEX idx_linhasdoc_idcabecdoc ON LinhasDoc (IdCabecDoc);
CREATE INDEX idx_linhasdoc_artigo ON LinhasDoc (Artigo);
CREATE INDEX idx_cabecdoc_entidade ON CabecDoc (Entidade);
CREATE INDEX idx_cabecdoc_tipoentidade ON CabecDoc (TipoEntidade);
CREATE INDEX idx_cabecdocstatus_idcabecdoc ON CabecDocStatus (IdCabecDoc);
CREATE INDEX idx_cabeccompras_entidade ON CabecCompras (Entidade);
CREATE INDEX idx_linhascompras_idcabeccompras ON LinhasCompras (IdCabecCompras);
CREATE INDEX idx_movimentos_conta ON Movimentos (Conta);
CREATE INDEX idx_funcrecibos_codfunc ON FuncRecibos (CodFunc);
CREATE INDEX idx_funcrecibosprocs_reciboid ON FuncRecibosProcs (ReciboID);
CREATE INDEX idx_rhpferias_codfunc ON RHP_Ferias (CodFunc);
CREATE INDEX idx_rhphistorico_codfunc ON RHP_HistoricoRegistoVinculo (CodFunc);
CREATE INDEX idx_invstock_artigo ON INV_ValoresActuaisStock (Artigo);
CREATE INDEX idx_invcusteio_artigo ON INV_ValoresActuaisCusteio (Artigo);
CREATE INDEX idx_gprcomponentes_idordem ON GPR_OrdemFabricoComponentes (IDOrdemFabrico);
CREATE INDEX idx_gproperacoes_idordem ON GPR_OrdemFabricoOperacoes (IDOrdemFabrico);
