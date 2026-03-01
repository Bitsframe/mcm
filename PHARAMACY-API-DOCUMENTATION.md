# Pharmacy Matching API Documentation

## Base URL
```
https://mcm-pharmacy-production.up.railway.app
```

## Overview
This API checks if a pharmacy exists in the database by matching phone number, address, zipcode, and state. It returns strong matches when multiple critical fields align.

---

## Endpoints

### 1. Health Check
Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl https://mcm-pharmacy-production.up.railway.app/health
```

---

### 2. Check Pharmacy Match
Check if a pharmacy exists in the database with matching criteria.

**Endpoint:** `POST /api/pharmacy/check`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "CVS Pharmacy",
  "phoneNumber": "(512) 213-4030",
  "address": {
    "streetAddress": "2800 S IH35 Frontage Road Suite 105",
    "zipcode": "78704",
    "state": "TX"
  }
}
```

**Field Descriptions:**

| Field | Type | Required | Description | Format |
|-------|------|----------|-------------|--------|
| name | string | Yes | Pharmacy name | 2-200 characters |
| phoneNumber | string | Yes | Phone number | Any format: (512) 213-4030, 512-213-4030, +15122134030 |
| address | object | Yes | Address details | - |
| address.streetAddress | string | Yes | Street address | 5-300 characters |
| address.zipcode | string | Yes | ZIP code | 12345 or 12345-6789 |
| address.state | string | Yes | State code | 2 letters (e.g., TX, CA) |

---

## Response Format

### Success Response (Match Found)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "matchFound": true,
  "matchType": "strong",
  "message": "Strong match found (phone + zipcode + address + state)",
  "data": [
    {
      "id": 1034,
      "name": "AVITA PHARMACY 1034",
      "address": "2800 S IH35 FRONTAGE ROAD SUITE 105",
      "city": "AUSTIN",
      "state": "TX",
      "zip_code": "78704",
      "phone_number": "(512) 213-4030",
      "spanish_language_service": true,
      "disabled_access": true,
      "license_status": "Active",
      "created_at": "2026-02-27T21:16:30.499013",
      "opening_hours": null,
      "delivers": true,
      "delivered_to_status_updated": null,
      "is_active": true
    }
  ]
}
```

### Success Response (No Match)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "matchFound": false,
  "matchType": "none",
  "message": "No match found",
  "data": null
}
```

### Error Response (Validation Error)

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": "Validation error",
  "details": "Phone number must be in valid format (e.g., +1234567890)"
}
```

### Error Response (Server Error)

**Status Code:** `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Matching Logic

The API uses a **strong match** algorithm that requires multiple fields to match:

### Strong Match Criteria (Case 1)
All 4 fields must match:
- ✅ Phone number (digits only, ignores formatting)
- ✅ Zipcode (exact match)
- ✅ Street address (partial match, case-insensitive)
- ✅ State (exact match)

### Strong Match Criteria (Case 2)
All 4 fields must match:
- ✅ Phone number (digits only, ignores formatting)
- ✅ Zipcode (exact match)
- ✅ Street address (partial match, case-insensitive)
- ✅ Name (partial match, case-insensitive)

**Note:** If only 1-2 fields match (e.g., just zipcode), no results are returned to avoid false positives.

---

## Phone Number Normalization

The API automatically normalizes phone numbers, so all these formats work:

| Input Format | Normalized To |
|--------------|---------------|
| (512) 213-4030 | +15122134030 |
| 512-213-4030 | +15122134030 |
| 5122134030 | +15122134030 |
| +1 512 213 4030 | +15122134030 |
| +15122134030 | +15122134030 |

---

## Code Examples

### JavaScript (Fetch)

```javascript
const checkPharmacy = async () => {
  const response = await fetch('https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'CVS Pharmacy',
      phoneNumber: '(512) 213-4030',
      address: {
        streetAddress: '2800 S IH35 Frontage Road',
        zipcode: '78704',
        state: 'TX'
      }
    })
  });

  const data = await response.json();
  console.log(data);
};

checkPharmacy();
```

### JavaScript (Axios)

```javascript
const axios = require('axios');

axios.post('https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check', {
  name: 'CVS Pharmacy',
  phoneNumber: '(512) 213-4030',
  address: {
    streetAddress: '2800 S IH35 Frontage Road',
    zipcode: '78704',
    state: 'TX'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error.response.data);
});
```

### Python (Requests)

```python
import requests

url = 'https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check'
payload = {
    'name': 'CVS Pharmacy',
    'phoneNumber': '(512) 213-4030',
    'address': {
        'streetAddress': '2800 S IH35 Frontage Road',
        'zipcode': '78704',
        'state': 'TX'
    }
}

response = requests.post(url, json=payload)
print(response.json())
```

### cURL

```bash
curl -X POST https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CVS Pharmacy",
    "phoneNumber": "(512) 213-4030",
    "address": {
      "streetAddress": "2800 S IH35 Frontage Road",
      "zipcode": "78704",
      "state": "TX"
    }
  }'
```

### PHP

```php
<?php
$url = 'https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check';
$data = array(
    'name' => 'CVS Pharmacy',
    'phoneNumber' => '(512) 213-4030',
    'address' => array(
        'streetAddress' => '2800 S IH35 Frontage Road',
        'zipcode' => '78704',
        'state' => 'TX'
    )
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data)
    )
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$response = json_decode($result);

print_r($response);
?>
```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP address
- **Response when exceeded:**
  ```json
  {
    "message": "Too many requests from this IP, please try again later."
  }
  ```

---

## CORS

The API accepts requests from all origins (`*`). If you need to restrict this, contact the API administrator.

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Route not found |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

---

## Testing

### Postman Collection

1. Create a new request in Postman
2. Set method to `POST`
3. URL: `https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "name": "AVITA PHARMACY 1034",
  "phoneNumber": "(512) 213-4030",
  "address": {
    "streetAddress": "2800 S IH35 Frontage Road Suite 105",
    "zipcode": "78704",
    "state": "TX"
  }
}
```

### Thunder Client (VS Code)

1. Install Thunder Client extension
2. New Request → POST
3. URL: `https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check`
4. Body → JSON → Paste the example above
5. Send

---

## Support

For issues or questions:
- Check API status: `GET /health`
- Review validation errors in response
- Verify all required fields are provided
- Ensure phone number and zipcode formats are correct

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Strong match algorithm
- Phone number normalization
- Rate limiting
- CORS support

---

## Database Schema Reference

The API searches the `pharmacy` table with these columns:

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Unique identifier |
| name | varchar | Pharmacy name |
| address | varchar | Street address |
| city | varchar | City name |
| state | char | 2-letter state code |
| zip_code | varchar | ZIP code |
| phone_number | varchar | Phone number |
| spanish_language_service | boolean | Spanish service available |
| disabled_access | boolean | Disabled access available |
| license_status | varchar | License status |
| created_at | timestamp | Record creation date |
| opening_hours | json | Opening hours |
| delivers | boolean | Delivery available |
| is_active | boolean | Active status |
