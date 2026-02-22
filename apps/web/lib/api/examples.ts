/**
 * API Client Usage Examples
 *
 * This file demonstrates how to use the typed API client
 * for common scenarios in the EquiTrack Pro application
 */

// ============================================================================
// CLIENT-SIDE EXAMPLES (use in 'use client' components)
// ============================================================================

// Example 1: Basic data fetching with useApi
// ============================================================================
/*
'use client';

import { useApi } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

export function PropertiesPage() {
  const { data, isLoading, error, refetch } = useApi(
    '/properties',
    PropertyListSchema,
    {
      params: { skip: 0, take: 10 },
      refetchOnFocus: true, // Refetch when window regains focus
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {data?.items?.map(property => (
          <li key={property.id}>{property.name}</li>
        ))}
      </ul>
    </div>
  );
}
*/

// Example 2: Creating/Updating with useMutation
// ============================================================================
/*
'use client';

import { useMutation } from '@/lib/api';
import { PropertySchema } from '@equitrack/shared';
import { useState } from 'react';

export function CreatePropertyForm() {
  const { mutate, isPending, error } = useMutation(
    '/properties',
    'post',
    PropertySchema
  );

  const [formData, setFormData] = useState({
    name: '',
    type: 'LAND',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await mutate(formData);
    if (result) {
      // Success - redirect or show message
      alert(`Property ${result.id} created!`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Property name"
        disabled={isPending}
      />
      {error && <div className="error">{error.message}</div>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Property'}
      </button>
    </form>
  );
}
*/

// Example 3: Pagination with usePaginated
// ============================================================================
/*
'use client';

import { usePaginated } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

export function PropertiesWithPagination() {
  const {
    data,
    isLoading,
    page,
    totalPages,
    goToNext,
    goToPrevious,
  } = usePaginated(
    '/properties',
    PropertyListSchema,
    1, // initial page
    10 // page size
  );

  return (
    <div>
      {data?.items?.map(property => (
        <div key={property.id}>{property.name}</div>
      ))}
      <div className="pagination">
        <button onClick={() => goToPrevious()} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => goToNext()} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
*/

// Example 4: Search with debounce
// ============================================================================
/*
'use client';

import { useDebouncedApi } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';
import { useState } from 'react';

export function PropertySearch() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useDebouncedApi(
    search ? '/properties' : '', // Skip fetch if search is empty
    PropertyListSchema,
    500, // Debounce 500ms
    {
      params: { query: search },
    }
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search properties..."
      />
      {isLoading && <div>Searching...</div>}
      <div>
        {data?.items?.map(property => (
          <div key={property.id}>{property.name}</div>
        ))}
      </div>
    </div>
  );
}
*/

// Example 5: Error handling with detailed validation errors
// ============================================================================
/*
'use client';

import { useMutation, ApiErrorResponse } from '@/lib/api';
import { LeaseSchema } from '@equitrack/shared';
import { useState } from 'react';

export function CreateLeaseForm() {
  const { mutate, error } = useMutation('/leases', 'post', LeaseSchema);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const result = await mutate(data);

    // Handle validation errors
    if (error instanceof ApiErrorResponse && error.hasValidationErrors()) {
      setFieldErrors(error.getAllErrors());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Property ID</label>
        <input name="propertyId" />
        {fieldErrors.propertyId && (
          <div className="error">
            {fieldErrors.propertyId.join(', ')}
          </div>
        )}
      </div>

      <div>
        <label>Tenant Name</label>
        <input name="tenantName" />
        {fieldErrors.tenantName && (
          <div className="error">
            {fieldErrors.tenantName.join(', ')}
          </div>
        )}
      </div>

      {error && !error.hasValidationErrors() && (
        <div className="error">{error.message}</div>
      )}

      <button type="submit">Create Lease</button>
    </form>
  );
}
*/

// ============================================================================
// SERVER-SIDE EXAMPLES (use in Server Components or Server Actions)
// ============================================================================

// Example 6: Fetching data in a Server Component
// ============================================================================
/*
import { serverFetch } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

export default async function PropertiesPage() {
  const { data, requestId } = await serverFetch(
    '/properties',
    PropertyListSchema,
    {
      params: { skip: 0, take: 10 },
    }
  );

  return (
    <div>
      {data?.items?.map(property => (
        <div key={property.id}>{property.name}</div>
      ))}
    </div>
  );
}
*/

// Example 7: Server Action with mutation
// ============================================================================
/*
'use server';

import {
  serverApi,
  serverAction,
  handleApiError,
} from '@/lib/api';
import { PropertySchema } from '@equitrack/shared';

export const createPropertyAction = serverAction(
  async (formData: FormData) => {
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      location: formData.get('location'),
    };

    const response = await serverApi().post(
      '/properties',
      data,
      PropertySchema
    );

    return response.data;
  }
);

// Usage in Client Component:
// const result = await createPropertyAction(formData);
// if (result.error) {
//   // Show error
// } else {
//   // Handle success
// }
*/

// Example 8: Multiple related server actions
// ============================================================================
/*
'use server';

import { serverApi, serverActions } from '@/lib/api';
import {
  PropertySchema,
  PropertyUpdateSchema,
  LeaseSchema,
} from '@equitrack/shared';

export const propertyActions = serverActions({
  getProperty: async (id: string) => {
    const response = await serverApi().get(
      `/properties/${id}`,
      PropertySchema
    );
    return response.data;
  },

  updateProperty: async (id: string, data: any) => {
    const response = await serverApi().patch(
      `/properties/${id}`,
      data,
      PropertySchema
    );
    return response.data;
  },

  deleteProperty: async (id: string) => {
    await serverApi().delete(`/properties/${id}`);
    return { id };
  },

  getPropertyLeases: async (id: string) => {
    const response = await serverApi().get(
      `/properties/${id}/leases`,
      // LeaseListSchema if available
    );
    return response.data;
  },
});

// Usage in Client Component:
// const property = await propertyActions.getProperty('123');
// const updated = await propertyActions.updateProperty('123', newData);
*/

// Example 9: Type-safe server action with schema validation
// ============================================================================
/*
'use server';

import {
  serverApi,
  createServerAction,
  handleApiError,
} from '@/lib/api';
import {
  PropertyCreateSchema,
  PropertySchema,
} from '@equitrack/shared';

export const createPropertyWithValidation = createServerAction(
  async (input) => {
    const response = await serverApi().post(
      '/properties',
      input,
      PropertySchema
    );
    return response.data;
  },
  PropertyCreateSchema, // Input validation
  PropertySchema // Output validation
);
*/

// Example 10: Advanced: Custom API client configuration
// ============================================================================
/*
'use client';

import { createApiClient } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

// Create a custom client with auth and error handling
const authApiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
  },
  timeout: 60000,
  onError: (error) => {
    console.error('API Error:', error);
    // Could send to error tracking service
  },
  onSuccess: (data) => {
    console.log('API Success:', data);
  },
});

// Use custom client
authApiClient.get('/properties', PropertyListSchema);
*/

// ============================================================================
// Common Patterns
// ============================================================================

// Pattern 1: Loading skeleton while data fetches
// ============================================================================
/*
'use client';

import { useApi } from '@/lib/api';
import { PropertyListSchema } from '@equitrack/shared';

export function PropertiesWithSkeleton() {
  const { data, isLoading, isInitial } = useApi(
    '/properties',
    PropertyListSchema
  );

  if (isInitial) return <PropertyListSkeleton />;
  if (!data?.items) return null;

  return (
    <div>
      {isLoading && <div className="loading-overlay" />}
      {data.items.map(property => (
        <PropertyCard key={property.id} {...property} />
      ))}
    </div>
  );
}
*/

// Pattern 2: Optimistic updates
// ============================================================================
/*
'use client';

import { useApi, useMutation } from '@/lib/api';
import {
  PropertyListSchema,
  PropertySchema,
} from '@equitrack/shared';

export function PropertyListWithOptimistic() {
  const { data, mutate: setData } = useApi(
    '/properties',
    PropertyListSchema
  );
  const { mutate: updateProperty } = useMutation(
    '',
    'patch',
    PropertySchema
  );

  const handleUpdate = async (id: string, newData: any) => {
    // Optimistic update
    const oldData = data;
    const updatedItems = data?.items?.map(item =>
      item.id === id ? { ...item, ...newData } : item
    );
    setData(data ? { ...data, items: updatedItems } : null);

    // Actual update
    const result = await updateProperty(
      { ...newData },
      { throwErrors: true }
    );

    if (!result) {
      // Revert on error
      setData(oldData);
    }
  };

  return (
    <div>
      {data?.items?.map(property => (
        <PropertyCard
          key={property.id}
          {...property}
          onUpdate={(newData) =>
            handleUpdate(property.id, newData)
          }
        />
      ))}
    </div>
  );
}
*/

// Pattern 3: Dependent queries
// ============================================================================
/*
'use client';

import { useApi } from '@/lib/api';
import {
  PropertyListSchema,
  LeaseListSchema,
} from '@equitrack/shared';
import { useState } from 'react';

export function PropertyWithLeases() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<
    string | null
  >(null);

  const { data: properties } = useApi(
    '/properties',
    PropertyListSchema
  );

  // This query is skipped until a property is selected
  const { data: leases } = useApi(
    selectedPropertyId ? `/properties/${selectedPropertyId}/leases` : '',
    LeaseListSchema,
    {
      skip: !selectedPropertyId,
    }
  );

  return (
    <div>
      <select onChange={(e) => setSelectedPropertyId(e.target.value)}>
        <option value="">Select a property</option>
        {properties?.items?.map(p => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {leases?.items && (
        <div>
          <h3>Leases for {properties?.items?.find(p => p.id === selectedPropertyId)?.name}</h3>
          {leases.items.map(lease => (
            <LeaseCard key={lease.id} {...lease} />
          ))}
        </div>
      )}
    </div>
  );
}
*/

export { };
