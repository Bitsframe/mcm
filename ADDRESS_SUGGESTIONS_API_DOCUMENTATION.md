Let me trace through the complete flow to show you which APIs are triggered when the street address field changes:

Now let me check the pharmacy section to see how it uses the street address:

Perfect! Now I can show you the complete flow. Here are **TWO APIs** that are triggered when the street address field changes:

## Complete API Flow for Street Address Field

### API #1: Address Autocomplete (Railway Address API)

**Triggered:** When user types in the address field (after 300ms debounce, minimum 4 characters)

**URL:**
```
GET /api/address/suggestions?search={encoded_address}
```

**Which proxies to:**
```
https://mcm-pharmacy-production.up.railway.app/api/address/suggestions?search={encoded_address}
```

**Example Request:**
```javascript
fetch('/api/address/suggestions?search=PO%20Box%202931%2C%20Hartford%2C%20CT%2006104')
```

**Payload:** None (GET request, data in query string)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "suggestions": [
    {
      "streetLine": "PO Box 2931",
      "secondary": "",
      "city": "Hartford",
      "state": "CT",
      "zipcode": "06104",
      "fullAddress": "PO Box 2931, Hartford, CT 06104",
      "entries": 0
    }
  ]
}
```
