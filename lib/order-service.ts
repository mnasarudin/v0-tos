// 订单服务 - 处理PR到PO的转换逻辑

export interface PRItem {
  id: string
  requestNo: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: "draft" | "submitted" | "approved" | "rejected"
}

export interface POItem {
  id: string
  orderNo: string
  supplier: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: "draft" | "issued" | "received" | "cancelled"
  prId?: string // 关联的PR ID
}

// 模拟供应商数据
const suppliers = [
  "Acme Supplies",
  "SoftCo",
  "TechHub",
  "Office Depot",
  "Global Tech",
  "Supply Chain Co"
]

// 生成PO编号
function generatePONumber(): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PO-${year}${month}${random}`
}

// 根据物品类型选择供应商
function selectSupplier(item: string): string {
  const itemLower = item.toLowerCase()
  
  if (itemLower.includes('chair') || itemLower.includes('desk') || itemLower.includes('office')) {
    return suppliers[0] // Acme Supplies
  } else if (itemLower.includes('software') || itemLower.includes('license')) {
    return suppliers[1] // SoftCo
  } else if (itemLower.includes('laptop') || itemLower.includes('computer') || itemLower.includes('tech')) {
    return suppliers[2] // TechHub
  } else if (itemLower.includes('training') || itemLower.includes('material')) {
    return suppliers[3] // Office Depot
  } else {
    // 随机选择供应商
    return suppliers[Math.floor(Math.random() * suppliers.length)]
  }
}

// 计算PO价格（通常比PR价格稍高，考虑供应商利润）
function calculatePOPrice(prPrice: number): number {
  // 增加5-15%的利润空间
  const markup = 1 + (Math.random() * 0.1 + 0.05)
  return Math.round(prPrice * markup)
}

// 将PR转换为PO
export function convertPRToPO(pr: PRItem): POItem {
  const poNumber = generatePONumber()
  const supplier = selectSupplier(pr.item)
  const poPrice = calculatePOPrice(pr.unitPrice)
  
  return {
    id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    orderNo: poNumber,
    supplier: supplier,
    department: pr.department,
    requester: pr.requester,
    item: pr.item,
    quantity: pr.quantity,
    unitPrice: poPrice,
    status: "draft",
    prId: pr.id
  }
}

// 批量转换PR到PO
export function convertMultiplePRsToPOs(prs: PRItem[]): POItem[] {
  return prs
    .filter(pr => pr.status === "approved")
    .map(pr => convertPRToPO(pr))
}

// 验证PR是否可以转换为PO
export function canConvertPRToPO(pr: PRItem): boolean {
  return pr.status === "approved"
}

// 获取转换统计信息
export function getConversionStats(prs: PRItem[], pos: POItem[]) {
  const approvedPRs = prs.filter(pr => pr.status === "approved")
  const convertedPOs = pos.filter(po => po.prId)
  
  return {
    totalPRs: prs.length,
    approvedPRs: approvedPRs.length,
    convertedPOs: convertedPOs.length,
    pendingConversion: approvedPRs.length - convertedPOs.length
  }
}

