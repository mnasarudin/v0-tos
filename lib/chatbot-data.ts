// Chatbot Knowledge Base
// This file contains all the data that the chatbot can answer from

export interface ChatbotData {
  topics: Topic[]
  quickAnswers: QuickAnswer[]
  faqs: FAQ[]
}

// Ferry Schedule Data Structure
export interface FerrySchedule {
  date: string
  langkawiAuto: string[]
  langkawiRoro: string[]
  wantasRoro: string[]
}

export interface FerryScheduleData {
  route: string
  month: string
  year: string
  updateDate: string
  schedules: FerrySchedule[]
}

export interface Topic {
  keywords: string[]
  category: string
  responses: string[]
}

export interface QuickAnswer {
  question: string
  answer: string
}

export interface FAQ {
  category: string
  question: string
  answer: string
}

// Sample data - you can add your own data here
export const chatbotKnowledgeBase: ChatbotData = {
  topics: [
    {
      keywords: ["inventory", "stock", "items", "products"],
      category: "Inventory Management",
      responses: [
        "Our inventory management system helps you track stock levels, manage items, and generate reports.",
        "You can view low stock items, add new items, and monitor stock movements in the inventory section.",
        "Stock management includes stock-in, stock-out operations, and detailed inventory reports."
      ]
    },
    {
      keywords: ["purchase requisition", "pr", "requisition", "request"],
      category: "Purchase Requisitions",
      responses: [
        "Purchase Requisitions (PR) allow staff to request items for their department.",
        "You can create a new PR, view existing PRs, and check their approval status.",
        "PRs need to be approved by HOD or AHOD before they can be converted to Purchase Orders."
      ]
    },
    {
      keywords: ["purchase order", "po", "order", "vendor"],
      category: "Purchase Orders",
      responses: [
        "Purchase Orders are created from approved Purchase Requisitions.",
        "You can track PO status, manage vendor details, and monitor deliveries.",
        "POs include vendor information, items ordered, and approval workflow."
      ]
    },
    {
      keywords: ["vendor", "supplier", "partner"],
      category: "Vendor Management",
      responses: [
        "You can register new vendors, view vendor list, and manage vendor information.",
        "Vendors have shop pages where you can browse their products and categories.",
        "Each vendor has contact details, registration information, and product listings."
      ]
    },
    {
      keywords: ["dibuk cargo", "dibuk", "cargo"],
      category: "Contact Information",
      responses: [
        "You can contact Dibuk Cargo at: 📞 013-3504199"
      ]
    },
    {
      keywords: ["langkawi auto express", "auto express", "langkawi auto"],
      category: "Contact Information",
      responses: [
        "Here are the details for Langkawi Auto Express:\n📞 04-9669898 / 04-9666316\n🌐 Check out: https://www.langkawiauto.com/content/home/index/site:langkawiauto-link:1537#popup"
      ]
    },
    {
      keywords: ["langkawi roro", "roro langkawi"],
      category: "Contact Information",
      responses: [
        "Sure! Here's the contact for Langkawi RORO:\n📞 04-9854881 / 019-5743881\n🌐 Website: https://www.langkawiroro.com/"
      ]
    },
    {
      keywords: ["wantas roro", "wantas", "wantas langkawi"],
      category: "Contact Information",
      responses: [
        "You can reach Wantas RORO Langkawi at:\n📞 04-9668800 / 04-9668888 / 012-4335533\n🌐 Visit: https://production.wantasroro.com/"
      ]
    },
    {
      keywords: ["approval", "approve", "reject", "pending"],
      category: "Approval Workflow",
      responses: [
        "The approval workflow processes PRs and POs through designated approvers.",
        "HOD and AHOD roles have approval permissions for purchase requisitions.",
        "You can view pending approvals and track the status of your submissions."
      ]
    },
    {
      keywords: ["report", "reports", "analytics", "statistics"],
      category: "Reports",
      responses: [
        "Generate reports for inventory, purchases, vendors, and more.",
        "Reports help track system usage, monitor trends, and make data-driven decisions.",
        "Available reports include inventory reports, PR/PO reports, and vendor reports."
      ]
    },
    {
      keywords: ["help", "support", "assistance", "guide"],
      category: "General Help",
      responses: [
        "I'm here to help you with questions about Langkawi Port-Dermaga Tanjung Lembung!",
        "You can ask me about port services, RORO schedules, contact information, or any port-related inquiries.",
        "Our support hours are 8:00 AM to 5:00 PM on weekdays."
      ]
    },
    {
      keywords: ["hours", "time", "contact", "available"],
      category: "Operating Hours",
      responses: [
        "Our operating hours are from 8:00 AM to 5:00 PM on weekdays.",
        "Visit our website at https://langkawiport.com.my/ to know more details.",
        "For urgent matters, please contact us during our operating hours."
      ]
    },
    {
      keywords: ["ferry schedule", "schedule", "jadual", "ferry time", "timetable", "roro schedule"],
      category: "Ferry Schedule",
      responses: [
        "I can provide you with the ferry schedule from Kuala Perlis to Langkawi. Ask me for a specific date (e.g., 'schedule for 15/11') or 'full schedule' for all dates.",
        "The ferry schedule is available for November 2025. Three operators serve this route: Langkawi Auto, Langkawi RORO, and Wantas RORO. Ask me for a specific date or 'full schedule'.",
        "For the ferry schedule from Kuala Perlis to Langkawi, I have schedules for November 2025. Specify a date (e.g., 'schedule for 1/11') or ask for the 'full schedule'."
      ]
    }
  ],
  
  quickAnswers: [
    {
      question: "How do I create a purchase requisition?",
      answer: "Go to Purchase Requisitions > Add PR. Fill in the required details including items, quantities, and department information. Submit for approval."
    },
    {
      question: "Where can I view low stock items?",
      answer: "Navigate to Inventory > Stock to see low stock items. Items below the minimum stock level are highlighted in the dashboard."
    },
    {
      question: "How do I register a new vendor?",
      answer: "Go to Vendors > Register Vendor. Provide the vendor's company information, contact details, and any additional required information."
    },
    {
      question: "What is the approval process?",
      answer: "Purchase Requisitions are submitted by staff, then reviewed and approved by HOD or AHOD. Once approved, they can be converted to Purchase Orders."
    },
    {
      question: "How do I check my PR status?",
      answer: "Go to Purchase Requisitions > List to view all PRs. You can filter by status: Draft, Pending, Approved, or Rejected."
    },
    {
      question: "How do I reach Dibuk Cargo?",
      answer: "You can contact Dibuk Cargo at:\n📞 013-3504199"
    },
    {
      question: "What's the phone number for Langkawi Auto Express?",
      answer: "Here are the details for Langkawi Auto Express:\n📞 04-9669898 / 04-9666316\n🌐 Check out: https://www.langkawiauto.com/content/home/index/site:langkawiauto-link:1537#popup"
    },
    {
      question: "Can I have the contact info for Langkawi RORO?",
      answer: "Sure! Here's the contact for Langkawi RORO:\n📞 04-9854881 / 019-5743881\n🌐 Website: https://www.langkawiroro.com/"
    },
    {
      question: "How can I contact Wantas RORO Langkawi?",
      answer: "You can reach Wantas RORO Langkawi at:\n📞 04-9668800 / 04-9668888 / 012-4335533\n🌐 Visit: https://production.wantasroro.com/"
    },
    {
      question: "What is the ferry schedule from Kuala Perlis to Langkawi?",
      answer: "📅 Ferry Schedule: Kuala Perlis - Langkawi\nMonth: November 2025\nLast Updated: 01/11/2025\n\nSample Schedule (first few dates):\n\n1/11/2025:\n  • Langkawi Auto: 11.00 AM / 13.00 PM\n  • Langkawi RORO: 12.00 PM\n  • Wantas RORO: 13.30 PM\n\n💡 To see schedule for a specific date, ask: \"schedule for [date]\" (e.g., \"schedule for 15/11\")\n\n📞 Contact Information:\n• Wantas RORO: 04-9668800 / 04-9668888 / 012-4335533\n• Langkawi RORO: 04-9854881 / 019-5743881\n• Langkawi Auto: 04-9669898 / 04-9666316\n• Dibuk: 013-3504199"
    },
    {
      question: "Show me the ferry schedule",
      answer: "📅 Ferry Schedule: Kuala Perlis - Langkawi\nMonth: November 2025\nLast Updated: 01/11/2025\n\nI can show you the complete schedule or schedule for a specific date. Ask me \"schedule for [date]\" for a specific date, or \"full schedule\" for all dates.\n\n💡 I have schedules for both routes:\n• Kuala Perlis to Langkawi\n• Langkawi to Kuala Perlis\n\nSpecify the route when asking (e.g., \"schedule from langkawi to kuala perlis\")."
    },
    {
      question: "What is the ferry schedule from Langkawi to Kuala Perlis?",
      answer: "📅 Ferry Schedule: Langkawi - Kuala Perlis\nMonth: November 2025\nLast Updated: 01/11/2025\n\nSample Schedule (first few dates):\n\n1/11/2025:\n  • Langkawi Auto: 10.00 AM / 16.00 PM\n  • Langkawi RORO: 09.00 AM\n  • Wantas RORO: 10.00 AM\n\n💡 To see schedule for a specific date, ask: \"schedule for [date]\" (e.g., \"schedule for 15/11\")\n\n📞 Contact Information:\n• Wantas RORO: 04-9668880 / 04-9668888 / 012-4335533\n• Langkawi RORO: 04-9669881 / 013-7495881 / 013-7213881\n• Langkawi Auto: 04-9669898 / 04-9666316\n• Langkawi Kedah RORO: 04-9611515 / 04-7622515\n• Dibuk: 013-3504199"
    }
  ],
  
  faqs: [
    {
      category: "Getting Started",
      question: "What is the TOS system?",
      answer: "TOS (Terms of Service) is a comprehensive procurement and inventory management system for tracking purchases, managing inventory, and coordinating with vendors."
    },
    {
      category: "Getting Started",
      question: "Who can use this system?",
      answer: "The system is designed for staff, HOD, AHOD, approval officers, and makers. Each role has specific permissions and access levels."
    },
    {
      category: "Inventory",
      question: "How does stock-in work?",
      answer: "Stock-in allows you to add items to your inventory. Navigate to Inventory > Stock In, select the items and quantities, and record the transaction."
    },
    {
      category: "Inventory",
      question: "Can I export inventory reports?",
      answer: "Yes! Go to Inventory > Reports to generate and export detailed inventory reports including stock levels, movements, and analytics."
    },
    {
      category: "Vendors",
      question: "How do I search for vendors?",
      answer: "Use the Vendor List page to browse all vendors. You can filter by category or search by vendor name using the search function."
    },
    {
      category: "Vendors",
      question: "What information is stored for vendors?",
      answer: "Vendor records include company name, contact person, email, phone, address, registration details, and product categories."
    }
  ]
}

// Ferry Schedule Data Storage - supports multiple routes
export interface FerrySchedules {
  [route: string]: FerryScheduleData
}

// Ferry Schedule Data for November 2025 - Kuala Perlis to Langkawi
export const ferryScheduleDataKpToLgw: FerryScheduleData = {
  route: "Kuala Perlis - Langkawi",
  month: "November",
  year: "2025",
  updateDate: "01/11/2025",
  schedules: [
    { date: "1/11/2025", langkawiAuto: ["11.00 AM", "13.00 PM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["13.30 PM"] },
    { date: "2/11/2025", langkawiAuto: ["08.30 AM", "13.00 PM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["13.00 PM", "20.00 PM"] },
    { date: "3/11/2025", langkawiAuto: ["09.00 AM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM", "20.00 PM"] },
    { date: "4/11/2025", langkawiAuto: ["09.00 AM"], langkawiRoro: ["14.00 PM"], wantasRoro: ["13.00 PM"] },
    { date: "5/11/2025", langkawiAuto: ["09.00 AM"], langkawiRoro: ["14.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "6/11/2025", langkawiAuto: ["10.00 AM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["13.00 PM"] },
    { date: "7/11/2025", langkawiAuto: ["11.00 AM", "14.30 PM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["13.00 PM"] },
    { date: "8/11/2025", langkawiAuto: ["11.00 AM", "14.30 PM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "9/11/2025", langkawiAuto: ["12.00 PM", "14.30 PM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "10/11/2025", langkawiAuto: ["12.30 PM"], langkawiRoro: ["14.00 PM"], wantasRoro: ["13.00 PM"] },
    { date: "11/11/2025", langkawiAuto: ["13.00 PM"], langkawiRoro: ["15.00 PM"], wantasRoro: ["13.30 PM"] },
    { date: "12/11/2025", langkawiAuto: ["10.00 AM"], langkawiRoro: ["15.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "13/11/2025", langkawiAuto: ["11.00 AM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["13.00 PM"] },
    { date: "14/11/2025", langkawiAuto: ["11.00 AM", "12.00 PM"], langkawiRoro: ["12.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "15/11/2025", langkawiAuto: ["12.00 AM", "13.00 PM"], langkawiRoro: ["12.30 PM"], wantasRoro: ["13.30 PM"] },
    { date: "16/11/2025", langkawiAuto: ["08.30 AM", "13.00 PM"], langkawiRoro: ["12.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "17/11/2025", langkawiAuto: ["09.00 AM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "18/11/2025", langkawiAuto: ["09.00 AM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "19/11/2025", langkawiAuto: ["09.00 AM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "20/11/2025", langkawiAuto: ["10.00 AM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "21/11/2025", langkawiAuto: ["10.00 AM", "14.30 PM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "22/11/2025", langkawiAuto: ["11.00 AM", "14.30 PM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "23/11/2025", langkawiAuto: ["11.00 AM", "14.30 PM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "24/11/2025", langkawiAuto: ["11.30 AM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "25/11/2025", langkawiAuto: ["12.30 PM"], langkawiRoro: ["14.00 PM"], wantasRoro: ["13.00 PM"] },
    { date: "26/11/2025", langkawiAuto: ["13.00 PM"], langkawiRoro: ["15.00 PM"], wantasRoro: ["13.30 PM"] },
    { date: "27/11/2025", langkawiAuto: ["13.30 PM"], langkawiRoro: ["15.30 PM"], wantasRoro: ["14.00 PM"] },
    { date: "28/11/2025", langkawiAuto: ["09.00 AM", "16.00 PM"], langkawiRoro: ["16.00 PM"], wantasRoro: ["14.00 PM"] },
    { date: "29/11/2025", langkawiAuto: ["10.00 AM", "17.00 PM"], langkawiRoro: ["16.30 PM"], wantasRoro: ["13.00 PM"] },
    { date: "30/11/2025", langkawiAuto: ["10.00 AM", "12.00 PM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["13.00 PM"] }
  ]
}

// Ferry Schedule Data for November 2025 - Langkawi to Kuala Perlis
export const ferryScheduleDataLgwToKp: FerryScheduleData = {
  route: "Langkawi - Kuala Perlis",
  month: "November",
  year: "2025",
  updateDate: "01/11/2025",
  schedules: [
    { date: "1/11/2025", langkawiAuto: ["10.00 AM", "16.00 PM"], langkawiRoro: ["09.00 AM"], wantasRoro: ["10.00 AM"] },
    { date: "2/11/2025", langkawiAuto: ["10.00 AM", "11.30 AM"], langkawiRoro: ["09.00 AM"], wantasRoro: ["09.30 AM", "16.30 PM"] },
    { date: "3/11/2025", langkawiAuto: ["12.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM", "16.30 PM"] },
    { date: "4/11/2025", langkawiAuto: ["12.00 PM"], langkawiRoro: ["10.30 AM"], wantasRoro: ["09.30 AM"] },
    { date: "5/11/2025", langkawiAuto: ["12.00 PM"], langkawiRoro: ["11.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "6/11/2025", langkawiAuto: ["13.00 PM"], langkawiRoro: ["09.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "7/11/2025", langkawiAuto: ["11.00 AM", "14.30 PM"], langkawiRoro: ["09.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "8/11/2025", langkawiAuto: ["11.00 AM", "14.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "9/11/2025", langkawiAuto: ["11.00 AM", "15.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "10/11/2025", langkawiAuto: ["15.30 PM"], langkawiRoro: ["10.30 AM"], wantasRoro: ["09.30 AM"] },
    { date: "11/11/2025", langkawiAuto: ["16.00 PM"], langkawiRoro: ["11.30 AM"], wantasRoro: ["10.00 AM"] },
    { date: "12/11/2025", langkawiAuto: ["14.00 PM"], langkawiRoro: ["12.00 PM"], wantasRoro: ["09.30 AM"] },
    { date: "13/11/2025", langkawiAuto: ["14.30 PM"], langkawiRoro: ["09.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "14/11/2025", langkawiAuto: ["09.00 AM", "15.30 PM"], langkawiRoro: ["09.30 AM"], wantasRoro: ["09.30 AM"] },
    { date: "15/11/2025", langkawiAuto: ["10.00 AM", "16.00 PM"], langkawiRoro: ["09.30 AM"], wantasRoro: ["10.00 AM"] },
    { date: "16/11/2025", langkawiAuto: ["10.00 AM", "11.30 AM"], langkawiRoro: ["09.30 AM"], wantasRoro: ["09.30 AM"] },
    { date: "17/11/2025", langkawiAuto: ["12.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "18/11/2025", langkawiAuto: ["12.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "19/11/2025", langkawiAuto: ["12.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "20/11/2025", langkawiAuto: ["13.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "21/11/2025", langkawiAuto: ["11.00 AM", "13.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "22/11/2025", langkawiAuto: ["11.00 AM", "14.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "23/11/2025", langkawiAuto: ["11.00 AM", "14.00 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "24/11/2025", langkawiAuto: ["14.30 PM"], langkawiRoro: ["10.00 AM"], wantasRoro: ["09.30 AM"] },
    { date: "25/11/2025", langkawiAuto: ["15.30 PM"], langkawiRoro: ["10.30 AM"], wantasRoro: ["09.30 AM"] },
    { date: "26/11/2025", langkawiAuto: ["16.00 PM"], langkawiRoro: ["11.00 AM"], wantasRoro: ["10.00 AM"] },
    { date: "27/11/2025", langkawiAuto: ["16.30 PM"], langkawiRoro: ["11.30 AM"], wantasRoro: ["10.30 AM"] },
    { date: "28/11/2025", langkawiAuto: ["13.00 PM", "14.00 PM"], langkawiRoro: ["13.00 PM"], wantasRoro: ["10.30 AM"] },
    { date: "29/11/2025", langkawiAuto: ["14.00 PM", "15.00 PM"], langkawiRoro: ["13.30 PM"], wantasRoro: ["09.30 AM"] },
    { date: "30/11/2025", langkawiAuto: ["09.00 AM", "15.00 PM"], langkawiRoro: ["09.00 AM"], wantasRoro: ["09.30 AM"] }
  ]
}

// Combined ferry schedule data accessor
export const ferrySchedules: FerrySchedules = {
  "kuala perlis - langkawi": ferryScheduleDataKpToLgw,
  "langkawi - kuala perlis": ferryScheduleDataLgwToKp,
  "kuala perlis to langkawi": ferryScheduleDataKpToLgw,
  "langkawi to kuala perlis": ferryScheduleDataLgwToKp,
  "perlis to langkawi": ferryScheduleDataKpToLgw,
  "langkawi to perlis": ferryScheduleDataLgwToKp,
  "perlis langkawi": ferryScheduleDataKpToLgw,
  "langkawi perlis": ferryScheduleDataLgwToKp
}

// Helper function to detect route direction from user input
function detectRoute(userInput: string): FerryScheduleData {
  const lowerInput = userInput.toLowerCase()
  
  // Check for reverse route (Langkawi to Kuala Perlis)
  const reverseKeywords = [
    "langkawi to kuala perlis", "langkawi to perlis", "langkawi perlis",
    "from langkawi", "langkawi - kuala perlis", "langkawi - perlis"
  ]
  
  // Check for forward route (Kuala Perlis to Langkawi)
  const forwardKeywords = [
    "kuala perlis to langkawi", "perlis to langkawi", "perlis langkawi",
    "from perlis", "from kuala perlis", "kuala perlis - langkawi"
  ]
  
  // Check reverse route first
  if (reverseKeywords.some(keyword => lowerInput.includes(keyword))) {
    return ferryScheduleDataLgwToKp
  }
  
  // Check forward route
  if (forwardKeywords.some(keyword => lowerInput.includes(keyword))) {
    return ferryScheduleDataKpToLgw
  }
  
  // Default to forward route (Kuala Perlis to Langkawi) if no direction specified
  return ferryScheduleDataKpToLgw
}

// Helper function to get contact info based on route
function getContactInfo(route: FerryScheduleData): string {
  if (route.route === "Langkawi - Kuala Perlis") {
    // Different contacts for reverse route (Langkawi to Kuala Perlis)
    return `📞 Contact Information:\n• Wantas RORO: 04-9668880 / 04-9668888 / 012-4335533\n• Langkawi RORO: 04-9669881 / 013-7495881 / 013-7213881\n• Langkawi Auto: 04-9669898 / 04-9666316\n• Langkawi Kedah RORO: 04-9611515 / 04-7622515\n• Dibuk: 013-3504199`
  } else {
    // Forward route contacts (Kuala Perlis to Langkawi)
    return `📞 Contact Information:\n• Wantas RORO: 04-9668800 / 04-9668888 / 012-4335533\n• Langkawi RORO: 04-9854881 / 019-5743881\n• Langkawi Auto: 04-9669898 / 04-9666316\n• Dibuk: 013-3504199`
  }
}

// Helper function to detect schedule queries
function isScheduleQuery(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase()
  const scheduleKeywords = [
    "schedule", "jadual", "timetable", "ferry schedule", "ferry time",
    "kuala perlis to langkawi", "perlis langkawi", "ferry from perlis",
    "langkawi to kuala perlis", "langkawi to perlis", "langkawi perlis",
    "departure time", "when does", "what time", "time table"
  ]
  return scheduleKeywords.some(keyword => lowerInput.includes(keyword))
}

// Format schedule for a specific date
function getScheduleForDate(dateStr: string, routeData: FerryScheduleData): string | null {
  const schedule = routeData.schedules.find(s => s.date === dateStr)
  if (!schedule) return null
  
  let result = `Ferry Schedule for ${schedule.date} (${routeData.route}):\n\n`
  result += `🚢 Langkawi Auto: ${schedule.langkawiAuto.join(" / ")}\n`
  result += `🚢 Langkawi RORO: ${schedule.langkawiRoro.join(" / ")}\n`
  result += `🚢 Wantas RORO: ${schedule.wantasRoro.join(" / ")}\n`
  
  return result
}

// Get full schedule response
function getFullScheduleResponse(routeData: FerryScheduleData): string {
  let response = `📅 RORO Ferry Schedule - ${routeData.month} ${routeData.year}\n`
  response += `Route: ${routeData.route}\n`
  response += `Last Updated: ${routeData.updateDate}\n\n`
  response += `Here's the complete schedule:\n\n`
  
  // Group by date ranges for better readability (show first 10 dates)
  routeData.schedules.slice(0, 10).forEach(schedule => {
    response += `${schedule.date}:\n`
    response += `  • Langkawi Auto: ${schedule.langkawiAuto.join(" / ")}\n`
    response += `  • Langkawi RORO: ${schedule.langkawiRoro.join(" / ")}\n`
    response += `  • Wantas RORO: ${schedule.wantasRoro.join(" / ")}\n\n`
  })
  
  response += `... and more dates available. Please specify a date for detailed information.\n\n`
  response += getContactInfo(routeData)
  response += `\n\nNote: Any changes to travel times will be updated from time to time. Please contact the operator for the latest information.`
  
  return response
}

// Extract date from user input (simple pattern matching)
function extractDateFromInput(userInput: string): string | null {
  const lowerInput = userInput.toLowerCase()
  
  // Try to match date patterns like "1/11", "1/11/2025", "15/11", etc.
  const datePattern1 = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/i // 1/11 or 1/11/2025
  const match1 = lowerInput.match(datePattern1)
  if (match1) {
    const day = match1[1]
    const month = match1[2]
    const year = match1[3] || "2025"
    // Check if month is 11 (November) - our schedule is for November
    if (month === "11") {
      return `${day}/11/${year}`
    }
    // If it's a valid month format but not 11, and we're looking for November schedule,
    // we might still want to return it if user meant November (context-dependent)
    // For now, only return if month is 11
  }
  
  // Try patterns like "1 november", "15 nov", "november 1"
  const datePattern2 = /(\d{1,2})\s+(november|nov)/i
  const match2 = lowerInput.match(datePattern2)
  if (match2) {
    const day = match2[1]
    return `${day}/11/2025`
  }
  
  const datePattern3 = /(november|nov)\s+(\d{1,2})/i
  const match3 = lowerInput.match(datePattern3)
  if (match3) {
    const day = match3[2]
    return `${day}/11/2025`
  }
  
  return null
}

// Get schedule response based on user query
function getScheduleResponse(userInput: string): string | null {
  const lowerInput = userInput.toLowerCase()
  
  // Detect route direction
  const routeData = detectRoute(userInput)
  
  // Check if user asks for a specific date
  const dateExtracted = extractDateFromInput(userInput)
  if (dateExtracted) {
    const schedule = getScheduleForDate(dateExtracted, routeData)
    if (schedule) {
      return schedule + `\n\n${getContactInfo(routeData)}`
    } else {
      // Date was extracted but not found in schedule
      return `Sorry, I couldn't find a schedule for ${dateExtracted}. The current schedule is for November 2025. Please specify a date in November (e.g., "schedule for 15/11").\n\n${getContactInfo(routeData)}`
    }
  }
  
  // Check for keywords that suggest full schedule
  if (lowerInput.includes("full") || lowerInput.includes("complete") || lowerInput.includes("all") || lowerInput.includes("entire")) {
    return getFullScheduleResponse(routeData)
  }
  
  // Default: return summary with first few dates
  let response = `📅 Ferry Schedule: ${routeData.route}\n`
  response += `Month: ${routeData.month} ${routeData.year}\n`
  response += `Last Updated: ${routeData.updateDate}\n\n`
  
  response += `Sample Schedule (first few dates):\n\n`
  routeData.schedules.slice(0, 5).forEach(schedule => {
    response += `${schedule.date}:\n`
    response += `  • Langkawi Auto: ${schedule.langkawiAuto.join(" / ")}\n`
    response += `  • Langkawi RORO: ${schedule.langkawiRoro.join(" / ")}\n`
    response += `  • Wantas RORO: ${schedule.wantasRoro.join(" / ")}\n\n`
  })
  
  response += `💡 To see schedule for a specific date, ask: "schedule for [date]" (e.g., "schedule for 15/11")\n\n`
  response += getContactInfo(routeData)
  
  return response
}

// Helper function to detect greetings
function isGreeting(userInput: string): boolean {
  const lowerInput = userInput.toLowerCase().trim()
  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "greetings", "howdy"]
  return greetings.some(greeting => lowerInput === greeting || lowerInput.startsWith(greeting + " ") || lowerInput.endsWith(" " + greeting))
}

// Get greeting response
function getGreetingResponse(): string {
  const greetings = [
    "Hello! 👋 How can I help you today?",
    "Hi there! 😊 What can I assist you with?",
    "Hello! Welcome to TOS Support. How may I help you?",
    "Hi! I'm here to help. What would you like to know?",
    "Hello! 👋 Feel free to ask me anything about our system or services."
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

// Helper function to find matching responses based on user input
export function findMatchingResponse(userInput: string): string | null {
  const lowerInput = userInput.toLowerCase()
  
  // Check for greetings first
  if (isGreeting(userInput)) {
    return getGreetingResponse()
  }
  
  // Check for schedule queries (high priority)
  if (isScheduleQuery(userInput)) {
    const scheduleResponse = getScheduleResponse(userInput)
    if (scheduleResponse) {
      return scheduleResponse
    }
  }
  
  // Check quick answers first (exact or close match)
  for (const quickAnswer of chatbotKnowledgeBase.quickAnswers) {
    const questionWords = quickAnswer.question.toLowerCase().split(/\s+/)
    const matchingWords = questionWords.filter(word => {
      // Skip common words
      const commonWords = ["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "i", "you", "he", "she", "it", "we", "they", "what", "where", "when", "why", "how", "to", "for", "of", "on", "at", "in", "with", "by", "from", "about", "into", "through", "during", "before", "after", "above", "below", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once"]
      return !commonWords.includes(word.toLowerCase()) && word.length > 2
    }).filter(word => lowerInput.includes(word.toLowerCase()))
    
    // Improved matching: check if at least 2 meaningful words match, or if it's a close match to the question
    if (matchingWords.length >= 2) {
      return quickAnswer.answer
    }
    
    // Also check for exact or near-exact question match
    const questionLower = quickAnswer.question.toLowerCase()
    if (lowerInput.includes(questionLower) || questionLower.includes(lowerInput) || 
        lowerInput.split(/\s+/).filter(w => questionLower.includes(w)).length >= 3) {
      return quickAnswer.answer
    }
  }
  
  // Check FAQs
  for (const faq of chatbotKnowledgeBase.faqs) {
    const questionWords = faq.question.toLowerCase().split(/\s+/)
    const matchingWords = questionWords.filter(word => {
      const commonWords = ["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "i", "you", "he", "she", "it", "we", "they", "what", "where", "when", "why", "how", "to", "for", "of", "on", "at", "in", "with", "by", "from", "about", "into", "through", "during", "before", "after", "above", "below", "up", "down", "out", "off", "over", "under", "again", "further", "then", "once"]
      return !commonWords.includes(word.toLowerCase()) && word.length > 2
    }).filter(word => lowerInput.includes(word.toLowerCase()))
    
    if (matchingWords.length >= 2) {
      return faq.answer
    }
    
    // Also check for exact or near-exact question match
    const questionLower = faq.question.toLowerCase()
    if (lowerInput.includes(questionLower) || questionLower.includes(lowerInput) || 
        lowerInput.split(/\s+/).filter(w => questionLower.includes(w)).length >= 3) {
      return faq.answer
    }
  }
  
  // Check topics by keywords (check all keywords, find best match)
  let bestTopicMatch: string | null = null
  let highestMatchCount = 0
  
  for (const topic of chatbotKnowledgeBase.topics) {
    let matchCount = 0
    for (const keyword of topic.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        matchCount++
      }
    }
    
    if (matchCount > highestMatchCount && matchCount > 0) {
      highestMatchCount = matchCount
      const randomResponse = topic.responses[Math.floor(Math.random() * topic.responses.length)]
      bestTopicMatch = randomResponse
    }
  }
  
  if (bestTopicMatch) {
    return bestTopicMatch
  }
  
  return null
}

// Get a default response when no match is found
export function getDefaultResponse(): string {
  const defaultResponses = [
    "I'm not sure I understand. Could you rephrase your question?",
    "That's an interesting question. Let me help you by asking - are you looking for information about inventory, purchase requisitions, vendors, or something else?",
    "I don't have specific information about that. Please try asking about inventory, purchases, vendors, or reports, or contact our support team.",
    "Could you provide more details? I can help with questions about the TOS system, inventory management, purchase requisitions, or vendors."
  ]
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
}



