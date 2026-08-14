import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";

export default function CostAllocationPage() {
  const [activeTab, setActiveTab] = useState<"costs" | "revenue" | "margin">("costs");
  const [loading, setLoading] = useState(true);

  // Mock data - depois será real de /api/cost-allocation
  const departmentData = {
    ADM: {
      name: "Administração",
      pessoal: 9300.00, // 5 pessoas: João (3k) + Maria (2.2k) + Ana (1.2k) + Conceição (1.8k) + Rita (1.1k)
      contribuicoes: 2206.50, // 23.75%
      encargos: 250.00,
      custoTotal: 11756.50,
      receita: 0, // Sem receita direta
      margem: -11756.50
    },
    PRD: {
      name: "Produção",
      pessoal: 5200.00, // 4 pessoas: Pedro (1.5k) + Carlos (1k) + Rui (1.4k) + Paulo (1.3k)
      contribuicoes: 1234.00, // 23.75%
      encargos: 200.00,
      custoTotal: 6634.00,
      receita: 45000.00, // Exemplo: produtos fabricados geram €45k
      margem: 38366.00
    },
    COM: {
      name: "Comercial",
      pessoal: 1300.00, // 1 pessoa: Joana
      contribuicoes: 308.75, // 23.75%
      encargos: 50.00,
      custoTotal: 1658.75,
      receita: 83900.00, // Exemplo: vendedores geram €83.9k
      margem: 82241.25
    }
  };

  const totalPessoal = Object.values(departmentData).reduce((s, d) => s + d.pessoal, 0);
  const totalReceita = Object.values(departmentData).reduce((s, d) => s + d.receita, 0);
  const totalCusto = Object.values(departmentData).reduce((s, d) => s + d.custoTotal, 0);
  const margemGeral = totalReceita - totalCusto;

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div className="py-12">Carregando análise...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Análise de Custos por Departamento
        </h1>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">Custo Total RH/Mês</div>
          <div className="text-2xl font-bold">{totalPessoal.toFixed(0)} €</div>
          <div className="text-xs text-gray-500 mt-1">Salários: {(totalPessoal / (totalPessoal + totalCusto - totalPessoal) * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
          <div className="text-sm text-gray-600">Receita Total/Mês</div>
          <div className="text-2xl font-bold">{(totalReceita / 1000).toFixed(1)} k€</div>
          <div className="text-xs text-gray-500 mt-1">83.9k Comercial + 45k Produção</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-orange-500">
          <div className="text-sm text-gray-600">Custo Operacional</div>
          <div className="text-2xl font-bold">{(totalCusto / 1000).toFixed(1)} k€</div>
          <div className="text-xs text-gray-500 mt-1">RH + contribuições + encargos</div>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500">
          <div className="text-sm text-gray-600">Margem Contribuição</div>
          <div className="text-2xl font-bold text-purple-600">{(margemGeral / 1000).toFixed(1)} k€</div>
          <div className="text-xs text-gray-500 mt-1">{((margemGeral / totalReceita) * 100).toFixed(1)}% da receita</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab("costs")} className={`px-4 py-3 font-medium ${activeTab === "costs" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}>
          💰 Custos por Departamento
        </button>
        <button onClick={() => setActiveTab("revenue")} className={`px-4 py-3 font-medium ${activeTab === "revenue" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}>
          📊 Receitas por Departamento
        </button>
        <button onClick={() => setActiveTab("margin")} className={`px-4 py-3 font-medium ${activeTab === "margin" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}>
          📈 Margem de Contribuição
        </button>
      </div>

      {/* Content by Tab */}
      {activeTab === "costs" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Custos operacionais mensais (salários + contribuições + encargos) por departamento</p>
          {Object.entries(departmentData).map(([key, dept]) => (
            <div key={key} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{dept.name}</h3>
                  <p className="text-xs text-gray-500">Custo total mensal</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-600">{dept.custoTotal.toFixed(2)} €</div>
                  <div className="text-xs text-gray-500">{((dept.custoTotal / totalCusto) * 100).toFixed(1)}% do total</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="border-l-4 border-blue-400 pl-3">
                  <div className="text-gray-600">Salários</div>
                  <div className="font-bold">{dept.pessoal.toFixed(2)} €</div>
                </div>
                <div className="border-l-4 border-orange-400 pl-3">
                  <div className="text-gray-600">Contribuições (23.75%)</div>
                  <div className="font-bold">{dept.contribuicoes.toFixed(2)} €</div>
                </div>
                <div className="border-l-4 border-yellow-400 pl-3">
                  <div className="text-gray-600">Encargos Adicionais</div>
                  <div className="font-bold">{dept.encargos.toFixed(2)} €</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${(dept.custoTotal / totalCusto) * 100}%` }}></div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded p-4 border-2 border-gray-300">
            <div className="flex justify-between items-center">
              <div className="font-bold">TOTAL CUSTOS RH/MÊS</div>
              <div className="text-2xl font-bold text-red-600">{totalCusto.toFixed(2)} €</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Anual: {(totalCusto * 12).toFixed(2)} €</div>
          </div>
        </div>
      )}

      {activeTab === "revenue" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Receita mensal gerada por cada departamento</p>
          {Object.entries(departmentData).map(([key, dept]) => (
            <div key={key} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{dept.name}</h3>
                  <p className="text-xs text-gray-500">Receita mensal</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{dept.receita.toFixed(2)} €</div>
                  <div className="text-xs text-gray-500">{((dept.receita / totalReceita) * 100).toFixed(1)}% do total</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${(dept.receita / totalReceita) * 100}%` }}></div>
              </div>

              {/* Details */}
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Custo Operacional</div>
                  <div className="font-bold text-red-600">{dept.custoTotal.toFixed(2)} €</div>
                </div>
                <div>
                  <div className="text-gray-600">Margem</div>
                  <div className={`font-bold ${dept.margem >= 0 ? "text-green-600" : "text-red-600"}`}>{dept.margem.toFixed(2)} €</div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded p-4 border-2 border-gray-300">
            <div className="flex justify-between items-center">
              <div className="font-bold">TOTAL RECEITA/MÊS</div>
              <div className="text-2xl font-bold text-green-600">{totalReceita.toFixed(2)} €</div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Anual: {(totalReceita * 12).toFixed(2)} €</div>
          </div>
        </div>
      )}

      {activeTab === "margin" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Análise de rentabilidade por departamento (Receita - Custo)</p>
          {Object.entries(departmentData).map(([key, dept]) => {
            const margemPct = dept.receita > 0 ? (dept.margem / dept.receita) * 100 : -100;
            return (
              <div key={key} className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{dept.name}</h3>
                    <p className="text-xs text-gray-500">Margem de contribuição</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${dept.margem >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {dept.margem.toFixed(2)} €
                    </div>
                    <div className="text-xs text-gray-500">{margemPct.toFixed(1)}% de margem</div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receita:</span>
                    <span className="font-semibold text-green-600">+ {dept.receita.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo RH:</span>
                    <span className="font-semibold text-red-600">- {dept.custoTotal.toFixed(2)} €</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Margem:</span>
                    <span className={dept.margem >= 0 ? "text-green-600" : "text-red-600"}>{dept.margem.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Status */}
                {dept.margem < 0 && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700">⚠️ <strong>{dept.name}</strong> é centro de CUSTO (sem receita direta)</p>
                  </div>
                )}
                {dept.margem >= 0 && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded p-2">
                    <p className="text-xs text-green-700">✅ <strong>{dept.name}</strong> é centro de LUCRO (cobre custos + gera receita)</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded p-6 border-2 border-blue-200">
            <h3 className="font-bold text-lg mb-4">📊 Decisões Estratégicas</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. ADMINISTRAÇÃO (Centro de Custo)</strong>
                <p className="text-gray-700 mt-1">• Custo mensal: €11.756 (sem receita direta)</p>
                <p className="text-gray-700">• Impacto: 11.8% dos custos totais</p>
                <p className="text-red-600 font-semibold mt-1">→ Alocar como custo fixo sobre produtos ou departamentos produtivos</p>
              </div>
              <hr className="my-3" />
              <div>
                <strong>2. PRODUÇÃO (Centro de Lucro)</strong>
                <p className="text-gray-700 mt-1">• Receita: €45.000 | Custo: €6.634 | Margem: €38.366 (85.2%)</p>
                <p className="text-green-600 font-semibold mt-1">→ Produto altamente rentável - potencial de investimento</p>
              </div>
              <hr className="my-3" />
              <div>
                <strong>3. COMERCIAL (Centro de Lucro)</strong>
                <p className="text-gray-700 mt-1">• Receita: €83.900 | Custo: €1.658 | Margem: €82.241 (98%)</p>
                <p className="text-green-600 font-semibold mt-1">→ Maior gerador de receita - considerar expansão comercial</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
