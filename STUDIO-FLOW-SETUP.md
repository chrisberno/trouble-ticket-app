# Studio Flow Setup for Support Ticket TaskRouter Integration

## Overview
This guide explains how to create a Twilio Studio Flow in the RTC+Flex account that receives webhooks from the ticketing system and creates TaskRouter tasks for agents.

## Prerequisites
- Access to ConnieRTC(+FLEX) Twilio account (`AC6f01...c4a`)
- Studio and TaskRouter enabled
- Workspace SID from TaskRouter

## Step 1: Create the Studio Flow

1. Log into the **ConnieRTC(+FLEX)** account (NOT NSS or HHOVV)
2. Navigate to Studio → Flows
3. Click "Create new Flow"
4. Name it: `Support-Ticket-Handler`
5. Start with blank template

## Step 2: Configure the Flow

### Flow Variables (from webhook)
The flow will receive these parameters:
- `ticketId` - Unique ticket identifier
- `title` - Ticket title
- `description` - Full ticket description  
- `customerName` - Customer's name
- `customerPhone` - Customer's phone number
- `origin` - Which account submitted (NSS/HHOVV/DevSandBox)
- `channel` - Always "support-ticket"
- `priority` - high/medium/low
- `timestamp` - When ticket was created

### Flow Structure

```
Trigger (Webhook)
    ↓
Set Variables (Extract webhook data)
    ↓
Send to Flex (Create TaskRouter Task)
    ↓
Return Success
```

### Widget Configuration

#### 1. Trigger Widget
- Type: REST API Trigger
- Request URL will be provided after saving

#### 2. Set Variables Widget
Add a Set Variables widget to format the task attributes:
```json
{
  "type": "support-ticket",
  "ticketId": "{{trigger.request.body.ticketId}}",
  "title": "{{trigger.request.body.title}}",
  "description": "{{trigger.request.body.description}}",
  "customerName": "{{trigger.request.body.customerName}}",
  "customerPhone": "{{trigger.request.body.customerPhone}}",
  "origin": "{{trigger.request.body.origin}}",
  "priority": "{{trigger.request.body.priority}}",
  "timestamp": "{{trigger.request.body.timestamp}}",
  "channel": "support-ticket"
}
```

#### 3. Send to Flex Widget
- Channel: Custom
- Attributes: Use the variables from step 2
- Workflow: Select your Support workflow
- Task Channel: Default or create "support-ticket" channel
- From: Support System
- Priority: `{{trigger.request.body.priority}}`

#### 4. Return Widget
- HTTP Response Code: 200
- Content Type: application/json
- Response Body:
```json
{
  "success": true,
  "executionSid": "{{flow.sid}}",
  "taskSid": "{{widgets.send_to_flex_1.sid}}"
}
```

## Step 3: Configure TaskRouter

### Create Task Channel (if needed)
1. Go to TaskRouter → Task Channels
2. Create new channel: `support-ticket`
3. Set unique name: `support-ticket`

### Update Workflow
1. Go to TaskRouter → Workflows
2. Edit your Support workflow
3. Add routing for channel `support-ticket`:
```json
{
  "filter_friendly_name": "Support Tickets",
  "expression": "channel == 'support-ticket'",
  "targets": [
    {
      "queue": "Support Queue",
      "priority": "task.priority"
    }
  ]
}
```

## Step 4: Get the Webhook URL

1. After saving the Studio Flow, click on the Trigger widget
2. Copy the Webhook URL (looks like: `https://webhooks.twilio.com/v1/Accounts/AC.../Flows/FW.../Executions`)

## Step 5: Configure Environment Variables

Add these to your ticketing app's `.env.local`:

```bash
# RTC+Flex Account Credentials
TWILIO_RTC_ACCOUNT_SID=AC6f01...c4a
TWILIO_RTC_AUTH_TOKEN=your_auth_token_here

# Studio Flow Webhook URL
TWILIO_STUDIO_FLOW_WEBHOOK_URL=https://webhooks.twilio.com/v1/Accounts/AC.../Flows/FW.../Executions
```

## Step 6: Deploy and Test

1. Deploy the ticketing app with updated environment variables
2. Create a test ticket
3. Check Flex to see if task appears
4. Verify task attributes contain ticket information

## Testing the Integration

### Manual Test with cURL
```bash
curl -X POST https://trouble-ticket-app.vercel.app/api/webhook/taskrouter \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "TEST-001",
    "title": "Test Ticket",
    "description": "This is a test ticket",
    "customerName": "John Doe",
    "customerPhone": "+17025551234",
    "origin": "NSS",
    "priority": "medium"
  }'
```

### Expected Flex Task Attributes
```json
{
  "type": "support-ticket",
  "ticketId": "TEST-001",
  "title": "Test Ticket",
  "description": "This is a test ticket",
  "customerName": "John Doe",
  "customerPhone": "+17025551234",
  "origin": "NSS",
  "priority": "medium",
  "channel": "support-ticket",
  "timestamp": "2025-08-20T..."
}
```

## Multi-Tenant Considerations

All tickets from NSS, HHOVV, and DevSandBox will route to the RTC+Flex account. The `origin` field identifies which account submitted the ticket, allowing agents to provide appropriate support.

## Troubleshooting

1. **No task appears in Flex**
   - Check Studio Flow execution logs
   - Verify webhook URL is correct
   - Confirm environment variables are set

2. **Task appears but no attributes**
   - Check Set Variables widget configuration
   - Verify JSON formatting in Send to Flex widget

3. **Authentication errors**
   - Verify TWILIO_RTC_ACCOUNT_SID and AUTH_TOKEN
   - Ensure credentials are for RTC+Flex account, not NSS/HHOVV

## Next Steps

1. Customize task priority based on keywords
2. Add email notifications for high-priority tickets
3. Create custom Flex plugin to display ticket details
4. Add ability for agents to update ticket status from Flex