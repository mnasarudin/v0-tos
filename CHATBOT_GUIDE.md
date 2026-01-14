# Chatbot Knowledge Base Guide

## Overview

The chatbot now uses an intelligent knowledge base system that allows you to provide custom data and answers. The system analyzes user questions and provides relevant responses based on the data you've configured.

## How It Works

The chatbot searches through three levels of data:
1. **Quick Answers** - Fast responses to common questions
2. **FAQs** - Frequently asked questions with specific answers
3. **Topics** - Keyword-based responses for broader categories

## Adding Your Data

Edit the file: `v0-tos/lib/chatbot-data.ts`

### 1. Adding Quick Answers

For direct question-answer pairs:

```typescript
quickAnswers: [
  {
    question: "How do I create a purchase requisition?",
    answer: "Go to Purchase Requisitions > Add PR. Fill in the required details..."
  },
  // Add more quick answers here
]
```

**Tips:**
- Keep questions simple and natural
- Match the phrasing users might use
- The system looks for 2+ matching words

### 2. Adding FAQs

Similar to quick answers but with categories:

```typescript
faqs: [
  {
    category: "Inventory",
    question: "How does stock-in work?",
    answer: "Stock-in allows you to add items to your inventory..."
  },
  // Add more FAQs here
]
```

**Tips:**
- Use categories to organize FAQs
- Include the main keyword in the question
- Provide clear, actionable answers

### 3. Adding Topics

For keyword-based responses:

```typescript
topics: [
  {
    keywords: ["inventory", "stock", "items"],
    category: "Inventory Management",
    responses: [
      "Our inventory management system helps you track stock levels...",
      "You can view low stock items in the dashboard...",
      // Add more response variations
    ]
  },
  // Add more topics here
]
```

**Tips:**
- Add multiple keywords users might use
- Provide 2-3 response variations
- The bot picks randomly from these responses

## Understanding Matching Logic

The chatbot uses a smart matching system:

### Quick Answers & FAQs
- Checks if 2+ words from the question match user input
- Example: "create purchase requisition" matches "How do I create a purchase requisition?"

### Topics
- Checks if any keyword appears in user input
- Example: "inventory" keyword matches "Tell me about inventory"

### Default Response
- If no match is found, returns a helpful default message
- Encourages users to rephrase or specify their topic

## Best Practices

### 1. Use Natural Language
✅ Good: "How do I create a purchase requisition?"
❌ Bad: "PR creation process step-by-step"

### 2. Add Multiple Keywords
✅ Good: keywords: ["vendor", "supplier", "partner"]
❌ Bad: keywords: ["vendor"]

### 3. Provide Clear Answers
✅ Good: "Navigate to Inventory > Stock to see low stock items..."
❌ Bad: "Check the inventory page."

### 4. Keep Responses Concise
- Aim for 1-3 sentences
- Include actionable steps when possible
- Use bullet points for complex instructions

### 5. Test Your Changes
After adding new data, test with various phrasings:
- "How to create PR?"
- "Tell me about creating purchase requisitions"
- "I need to make a PR"

## Examples

### Example 1: Adding a New Quick Answer

```typescript
quickAnswers: [
  // ... existing answers
  {
    question: "How do I generate a report?",
    answer: "Go to Reports section in the main menu. Select the type of report you need (Inventory, PR, PO, or Vendor), choose your date range, and click Generate."
  }
]
```

### Example 2: Adding a New Topic

```typescript
topics: [
  // ... existing topics
  {
    keywords: ["password", "login", "authentication", "access"],
    category: "Security",
    responses: [
      "If you're having login issues, please contact your system administrator.",
      "Password reset functionality can be accessed from the login page.",
      "For account access problems, reach out to the IT support team."
    ]
  }
]
```

### Example 3: Adding a New FAQ

```typescript
faqs: [
  // ... existing FAQs
  {
    category: "User Account",
    question: "How do I change my password?",
    answer: "To change your password, go to your profile settings, click on Security, and select Change Password. You'll need to enter your current password and choose a new one."
  }
]
]

## Testing Your Chatbot

Try these sample questions to test the system:

1. **Inventory**: "Tell me about inventory management"
2. **PR**: "How do I create a purchase requisition?"
3. **Vendor**: "Where can I find vendors?"
4. **Reports**: "How to generate reports?"
5. **Hours**: "What are your operating hours?"
6. **Help**: "I need help with the system"

## Troubleshooting

### Bot not responding correctly?

1. Check keywords match user phrasing
2. Ensure 2+ words match for Quick Answers/FAQs
3. Verify responses are clear and helpful
4. Test with natural variations of questions

### Want exact matches only?

Modify the `findMatchingResponse` function to increase the matching threshold:

```typescript
// In chatbot-data.ts
if (matchingWords.length >= 3) {  // Changed from 2 to 3
  return quickAnswer.answer
}
```

### Need more sophisticated matching?

Consider:
- Adding regex patterns for specific formats
- Implementing fuzzy matching for typos
- Using NLP libraries for intent recognition

## Customization Options

You can customize the chatbot further by:

1. **Changing default responses** - Edit `getDefaultResponse()`
2. **Adjusting matching thresholds** - Modify word count requirements
3. **Adding response types** - Extend the Message interface
4. **Implementing context** - Track conversation history

## Next Steps

- Add domain-specific knowledge
- Implement multi-turn conversations
- Add support for multiple languages
- Integrate with external APIs
- Store conversation history

## Support

For questions or issues, check the main README or contact the development team.






















