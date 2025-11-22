"use client"

import { useState, useEffect } from "react"
import { useSales } from "@/lib/hooks"
import type { Sale } from "@/lib/db"
import { BarChart3, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReportScreen() {
  const { getSalesByMonth } = useSales()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [salesData, setSalesData] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReport()
  }, [selectedMonth, selectedYear])

  const loadReport = async () => {
    setLoading(true)
    try {
      const sales = await getSalesByMonth(selectedYear, selectedMonth)
      setSalesData(sales)
    } catch (error) {
      console.error("Error loading report:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const grossRevenue = salesData.reduce((sum, sale) => sum + sale.subtotal, 0)
  const totalDiscount = salesData.reduce((sum, sale) => sum + sale.discount, 0)
  const netRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0)
  const costOfGoodsSold = salesData.reduce((sum, sale) => sum + sale.costOfGoodsSold, 0)
  const netProfit = netRevenue - costOfGoodsSold
  const totalUnits = salesData.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  )

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  const exportToJSON = () => {
    const data = {
      period: `${monthNames[selectedMonth]} ${selectedYear}`,
      metrics: {
        grossRevenue,
        totalDiscount,
        netRevenue,
        costOfGoodsSold,
        netProfit,
        totalUnits,
      },
      sales: salesData,
      exportedAt: new Date().toISOString(),
    }

    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio_${monthNames[selectedMonth]}_${selectedYear}.json`
    a.click()
  }

  const exportToCSV = () => {
    const headers = ["Data", "Receita", "Desconto", "Total", "CMV", "Lucro"]
    const rows = salesData.map((sale) => [
      new Date(sale.createdAt).toLocaleDateString("pt-BR"),
      sale.subtotal.toFixed(2),
      sale.discount.toFixed(2),
      sale.total.toFixed(2),
      sale.costOfGoodsSold.toFixed(2),
      (sale.total - sale.costOfGoodsSold).toFixed(2),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      "RESUMO DO PERÍODO",
      `Receita Bruta,${grossRevenue.toFixed(2)}`,
      `Total Descontos,${totalDiscount.toFixed(2)}`,
      `Receita Líquida,${netRevenue.toFixed(2)}`,
      `CMV,${costOfGoodsSold.toFixed(2)}`,
      `Lucro Líquido,${netProfit.toFixed(2)}`,
      `Volume Vendido,${totalUnits}`,
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio_${monthNames[selectedMonth]}_${selectedYear}.csv`
    a.click()
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Period Selection */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold">Seleção de Período</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value))}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={loadReport} className="w-full bg-accent">
          <BarChart3 className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </Card>

      {/* Report Summary */}
      {!loading && salesData.length > 0 && (
        <>
          <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-muted">
            <h3 className="font-semibold text-lg">Resumo Financeiro</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Receita Bruta</p>
                <p className="text-xl font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(grossRevenue)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Descontos</p>
                <p className="text-xl font-bold text-destructive">
                  -
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalDiscount)}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-1">Receita Líquida</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(netRevenue)}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-1">CMV (Custo)</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(costOfGoodsSold)}
              </p>
            </div>

            <div className="bg-gradient-to-r from-success to-success/80 text-success-foreground p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Lucro Líquido do Período</p>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(netProfit)}
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">Volume de Itens Vendidos</p>
              <p className="text-2xl font-bold">{totalUnits} unidades</p>
            </div>
          </Card>

          {/* Sales Details */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Detalhes de Vendas</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Data</th>
                    <th className="text-right py-2 px-2">Receita</th>
                    <th className="text-right py-2 px-2">Desconto</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-right py-2 px-2">CMV</th>
                    <th className="text-right py-2 px-2">Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((sale) => {
                    const saleProfit = sale.total - sale.costOfGoodsSold
                    return (
                      <tr key={sale.id} className="border-b border-border hover:bg-muted">
                        <td className="py-2 px-2">{new Date(sale.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td className="text-right py-2 px-2">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(sale.subtotal)}
                        </td>
                        <td className="text-right py-2 px-2">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(sale.discount)}
                        </td>
                        <td className="text-right py-2 px-2 font-semibold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(sale.total)}
                        </td>
                        <td className="text-right py-2 px-2">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(sale.costOfGoodsSold)}
                        </td>
                        <td
                          className={`text-right py-2 px-2 font-semibold ${
                            saleProfit >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(saleProfit)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Export Options */}
          <div className="space-y-2 pb-4">
            <p className="text-sm font-medium">Exportar Relatório</p>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button onClick={exportToJSON} variant="outline" className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </>
      )}

      {!loading && salesData.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">Nenhuma venda registrada neste período</Card>
      )}

      {loading && <Card className="p-8 text-center text-muted-foreground">Carregando relatório...</Card>}
    </div>
  )
}
