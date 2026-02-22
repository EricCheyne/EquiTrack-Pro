# EquiTrack Pro Web API Client

Typed API client for the EquiTrack Pro web application with fetch + zod validation. Supports both server-side and client-side calls cleanly.

## Features

✅ **Type-Safe Requests & Responses** - Zod schema validation with full TypeScript inference
✅ **Dual-Mode Support** - Works seamlessly in both server components and client components
✅ **React Hooks** - `useApi`, `useMutation`, `usePaginated`, `useDebouncedApi`
✅ **Server Actions** - Type-safe server action helpers with validation
✅ **Error Handling** - RFC 7807 Problem Details with validation error details
✅ **Request Correlation** - Request ID tracing for distributed debugging
✅ **Cookie Management** - Automatic authentication cookie inclusion on server
✅ **Automatic Retries** - Configurable retry logic with exponential backoff
✅ **Refetch Strategies** - On focus, intervals, manual refetch
✅ **Pagination** - Built-in pagination hook with page navigation
✅ **Debounce** - Search/filter with configurable debounce delay

## Quick Start

### Installation

The API client is built into the web app. No additional installation needed.

### Basic Usage - Client Component

```typescript
'use client';

import { useApi } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

export function PropertiesPage() {
  const { data, isLoading, error } = useApi(
    '/properties',
    PropertyListSchema,
    { params: { skip: 0, take: 10 } }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.items?.map(property => (
        <li key={property.id}>{property.name}</li>
      ))}
    </ul>
  );
}
```

### Basic Usage - Server Component

```typescript
import { serverFetch } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

export default async function PropertiesPage() {
  const { data } = await serverFetch(
    '/properties',
    PropertyListSchema,
    { params: { skip: 0, take: 10 } }
  );

  return (
    <ul>
      {data?.items?.map(property => (
        <li key={property.id}>{property.name}</li>
      ))}
    </ul>
  );
}
```

### Basic Usage - Server Action

```typescript
'use server';

import { serverApi } from '@/lib/api';
import { PropertySchema } from '@equitrack/shared';

export async function createProperty(formData: FormData) {
  const data = Object.fromEntries(formData);
  const response = await serverApi().post(
    '/properties',
    data,
    PropertySchema
  );
  return response.data;
}
```

## Core Concepts

### 1. The API Client

The core `ApiClient` class handles all HTTP communication:

```typescript
import { apiClient, createApiClient } from '@/lib/api';

// Use the global instance
const response = await apiClient.get('/properties', PropertySchema);

// Or create a custom client
const customClient = createApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 60000,
  headers: { 'Authorization': 'Bearer token' },
});
```

### 2. Request Methods

```typescript
// GET - Fetch data
const response = await apiClient.get('/properties', PropertySchema, {
  params: { skip: 0, take: 10 }
});

// POST - Create resource
const response = await apiClient.post(
  '/properties',
  { name: 'Farm', type: 'LAND' },
  PropertySchema
);

// PATCH - Update resource
const response = await apiClient.patch(
  '/properties/123',
  { name: 'Updated Farm' },
  PropertySchema
);

// DELETE - Remove resource
const response = await apiClient.delete('/properties/123');

// Raw methods (no validation)
const response = await apiClient.getRaw('/health/ping');
```

### 3. Zod Validation

All responses are validated against zod schemas:

```typescript
import { PropertyListSchema } from '@equitrack/shared';

// This validates that the response matches the schema
const response = await apiClient.get(
  '/properties',
  PropertyListSchema
);

// If validation fails, throws ValidationError
// If status is not 2xx, throws ApiErrorResponse
```

### 4. Error Handling

The client provides detailed error information:

```typescript
import { ApiErrorResponse, NetworkError, ValidationError } from '@/lib/api';

try {
  await apiClient.post('/properties', data, PropertySchema);
} catch (error) {
  if (error instanceof ApiErrorResponse) {
    // HTTP error - includes status, detail, validation errors
    if (error.hasValidationErrors()) {
      const fieldErrors = error.getAllErrors(); // { name: [...], type: [...] }
      const nameErrors = error.getFieldErrors('name');
    }
  } else if (error instanceof NetworkError) {
    // Connection error
    console.log('Network error:', error.message);
  } else if (error instanceof ValidationError) {
    // Response doesn't match schema
    console.log('Response validation failed:', error.zodErrors);
  }
}
```

## Client-Side Hooks

### useApi - Data Fetching

Fetch data with loading/error states:

```typescript
const {
  data,           // Fetched data
  isLoading,      // Loading state
  isInitial,      // First load
  error,          // Error if one occurred
  refetch,        // Manual refetch function
  mutate,         // Optimistic update
} = useApi('/properties', PropertyListSchema, {
  params: { skip: 0, take: 10 },
  refetchOnFocus: true,        // Refetch when window gets focus
  refetchInterval: 30000,      // Refetch every 30 seconds
  retry: 3,                    // Retry failed requests 3 times
  retryDelay: 1000,            // Wait 1s between retries
  skip: false,                 // Skip fetching initially
  onSuccess: (data) => { },    // Called on success
  onError: (error) => { },     // Called on error
});
```

### useMutation - Create/Update/Delete

```typescript
const {
  mutate,        // Function to call mutation
  data,          // Response data
  error,         // Error if one occurred
  isPending,     // Loading state
  reset,         // Reset state
} = useMutation(
  '/properties',
  'post',           // 'post', 'patch', or 'delete'
  PropertySchema,
  { onSuccess: (data) => { } }
);

// Call the mutation
const result = await mutate({ name: 'Farm', type: 'LAND' });
```

### usePaginated - Pagination

```typescript
const {
  data,         // Current page data
  page,         // Current page number
  totalPages,   // Total pages
  goToPage,     // Go to specific page
  goToNext,     // Next page
  goToPrevious, // Previous page
  isLoading,
  error,
} = usePaginated(
  '/properties',
  PropertyListSchema,
  1,    // Initial page
  10    // Page size
);
```

### useDebouncedApi - Search/Filter

```typescript
const [search, setSearch] = useState('');

const { data, isLoading } = useDebouncedApi(
  '/properties',
  PropertyListSchema,
  500,  // Debounce 500ms
  { params: { query: search } }
);

// Input changes are debounced before making API request
return (
  <>
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
    {isLoading && <Spinner />}
    {data?.items?.map(item => <Item key={item.id} {...item} />)}
  </>
);
```

## Server-Side Helpers

### serverApi - Create Server Client

Create an API client that includes authentication cookies:

```typescript
'use server';

import { serverApi } from '@/lib/api';

// Automatically includes:
// - Authentication cookies
// - Request ID for tracing
// - Custom headers

const response = await serverApi().get(
  '/properties',
  PropertyListSchema
);
```

### serverFetch - Simple Data Fetch

For Server Components:

```typescript
import { serverFetch } from '@/lib/api';

export default async function Page() {
  const { data, requestId } = await serverFetch(
    '/properties',
    PropertyListSchema
  );

  return <PropertyList items={data?.items} />;
}
```

### createServerAction - Type-Safe Server Action

```typescript
'use server';

import { createServerAction } from '@/lib/api';
import { PropertyCreateSchema, PropertySchema } from '@equitrack/shared';

export const createProperty = createServerAction(
  async (input) => {
    const response = await serverApi().post(
      '/properties',
      input,
      PropertySchema
    );
    return response.data;
  },
  PropertyCreateSchema,  // Input validation
  PropertySchema         // Output validation
);

// In Client Component:
// const result = await createProperty(data);
// if (result.error) { /* show error */ }
// else { /* use result.data */ }
```

### serverActions - Multiple Actions

Organize related server actions:

```typescript
'use server';

import { serverActions } from '@/lib/api';

export const propertyActions = serverActions({
  create: async (data) => {
    return (await serverApi().post('/properties', data, PropertySchema)).data;
  },
  update: async (id, data) => {
    return (await serverApi().patch(`/properties/${id}`, data, PropertySchema)).data;
  },
  delete: async (id) => {
    await serverApi().delete(`/properties/${id}`);
  },
});
```

## Advanced Patterns

### Optimistic Updates

```typescript
const { data, mutate: setData } = useApi('/properties', PropertyListSchema);
const { mutate: updateProperty } = useMutation('/properties/:id', 'patch', PropertySchema);

const handleUpdate = async (id, newData) => {
  // Optimistic update
  const oldData = data;
  setData({
    ...data,
    items: data?.items?.map(item =>
      item.id === id ? { ...item, ...newData } : item
    ),
  });

  // Actual request
  const result = await updateProperty(newData);
  if (!result) {
    // Revert on error
    setData(oldData);
  }
};
```

### Dependent Queries

```typescript
const [selectedId, setSelectedId] = useState(null);

const { data: items } = useApi('/items', ItemListSchema);

// This query skips fetching until selectedId is set
const { data: details } = useApi(
  selectedId ? `/items/${selectedId}` : '',
  ItemDetailsSchema,
  { skip: !selectedId }
);
```

### Request Correlation

All requests automatically include `x-request-id` header for distributed tracing:

```typescript
const response = await apiClient.get('/properties', PropertySchema);
console.log(response.requestId); // UUID for tracing across services
```

## Error Handling

### API Errors (RFC 7807)

```typescript
try {
  await apiClient.post('/properties', data, PropertySchema);
} catch (error) {
  if (error instanceof ApiErrorResponse) {
    // Structured error with Problem Details format
    console.log(error.status);        // HTTP status code
    console.log(error.title);         // "Bad Request"
    console.log(error.detail);        // "Validation failed"
    console.log(error.errors);        // { name: [...], type: [...] }
    console.log(error.requestId);     // UUID for tracing
  }
}
```

### Network Errors

```typescript
try {
  await apiClient.get('/properties', PropertySchema);
} catch (error) {
  if (error instanceof NetworkError) {
    // Connection timeout or network issue
    console.log('Network error:', error.message);
    console.log(error.originalError); // Original error object
  }
}
```

### Validation Errors

```typescript
try {
  await apiClient.get('/properties', PropertyListSchema);
} catch (error) {
  if (error instanceof ValidationError) {
    // Response doesn't match schema
    console.log(error.zodErrors); // Detailed zod validation errors
  }
}
```

## Configuration

### Environment Variables

```bash
# API base URL (used on client-side)
NEXT_PUBLIC_API_URL=http://localhost:3001

# API URL for server-side internal calls
API_URL=http://localhost:3001

# API URL for server-to-server calls (container networking)
API_INTERNAL_URL=http://api:3001
```

### Custom Client Configuration

```typescript
import { createApiClient } from '@/lib/api';

const client = createApiClient({
  baseUrl: 'https://api.example.com',
  timeout: 60000,
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
  },
  onError: (error) => {
    console.error('API error:', error);
    // Send to error tracking service
  },
  onSuccess: (data) => {
    console.log('API success:', data);
    // Send to analytics
  },
});
```

## Testing

The API client includes examples that can be used as reference for testing. See `lib/api/examples.ts` for common patterns.

### Mock Testing

```typescript
import { jest } from '@jest/globals';

// Mock the API client
jest.mock('@/lib/api', () => ({
  useApi: jest.fn(() => ({
    data: { items: [] },
    isLoading: false,
    error: null,
    isInitial: false,
    refetch: jest.fn(),
    mutate: jest.fn(),
  })),
}));
```

## Best Practices

### 1. Always Validate Responses

```typescript
// ✅ Good - Response validated with schema
const { data } = await apiClient.get('/properties', PropertyListSchema);

// ❌ Bad - No validation
const { data } = await apiClient.getRaw('/properties');
```

### 2. Handle Errors Appropriately

```typescript
// ✅ Good
try {
  await mutate(data);
} catch (error) {
  if (error instanceof ApiErrorResponse) {
    showValidationErrors(error.getAllErrors());
  } else {
    showErrorMessage(error.message);
  }
}

// ❌ Bad
await mutate(data); // Unhandled error
```

### 3. Use Request IDs for Debugging

```typescript
// ✅ Good
const response = await apiClient.get('/properties', PropertyListSchema);
console.log('Request ID:', response.requestId); // Use for debugging

// ❌ Bad
// No way to correlate errors across services
```

### 4. Configure Retries for Reliability

```typescript
// ✅ Good
const { data } = useApi('/properties', PropertyListSchema, {
  retry: 3,
  retryDelay: 1000,
});

// ❌ Bad
const { data } = useApi('/properties', PropertyListSchema); // No retries
```

### 5. Refetch on Focus for Freshness

```typescript
// ✅ Good - Refreshes when user returns to tab
const { data } = useApi('/properties', PropertyListSchema, {
  refetchOnFocus: true,
});

// ❌ Bad - Data becomes stale if tab is idle
const { data } = useApi('/properties', PropertyListSchema);
```

## File Structure

```
lib/api/
├── index.ts                 # Main export point
├── types.ts                 # Types and error classes
├── client.ts                # Core ApiClient class
├── hooks.ts                 # React hooks (useApi, useMutation, etc)
├── server.ts                # Server-side helpers
├── examples.ts              # Usage examples (commented)
└── API-CLIENT.md           # This file
```

## Related Documentation

- [API Server Documentation](/services/api/README.md) - Backend API server
- [Shared Schemas](https://github.com/equitrack/shared) - Zod validation schemas
- [Zod Documentation](https://zod.dev) - Schema validation library
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

## Troubleshooting

### CORS Errors

If you get CORS errors, ensure:
1. API server is running and accessible
2. `NEXT_PUBLIC_API_URL` is set correctly
3. Server-side calls use `API_INTERNAL_URL` for container networking
4. API server has CORS configured properly

### Validation Errors

If response validation fails:
1. Check that the API response matches the schema
2. Ensure schema matches API server documentation
3. Verify API server is returning correct data types

### Timeout Errors

If requests timeout:
1. Check API server is responding
2. Increase timeout: `{ timeout: 60000 }`
3. Check network connectivity
4. Reduce request complexity

### Cookie/Auth Issues

For server-side auth:
1. Ensure auth cookies are being set by API
2. Use `serverApi()` in Server Components (automatically includes cookies)
3. Implement proper auth flow in Server Actions

## Contributing

When adding new API endpoints:

1. Add zod schema to `@equitrack/shared`
2. Create typed service methods in `lib/api/`
3. Add examples in `lib/api/examples.ts`
4. Update this documentation

## License

Part of EquiTrack Pro - All rights reserved
